import type { Item, PlacedItem, AirbagUsage } from "@shared/schema";
import type { TruckConfig } from "./truck-configs";
import { ITEM_CONFIGURATIONS, AIRBAG_CONFIGURATIONS } from "./truck-configs";

export interface OptimizationInput {
  items: Item[];
  truckType: string;
  truckConfig: TruckConfig;
  airbagInventory: AirbagUsage;
}

export interface OptimizationOutput {
  placedItems: PlacedItem[];
  remainingItems: Item[];
  usedAirbags: AirbagUsage;
  totalWeight: number;
  frontAxleLoad: number;
  rearAxleLoad: number;
  spaceUtilization: number;
  weightUtilization: number;
  loadBalance: string;
  gaps: Gap[];
}

interface Gap {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ItemPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  weight: number;
  item: Item;
}

export class PackingAlgorithm {
  static optimize(input: OptimizationInput): OptimizationOutput {
    const { items, truckConfig, airbagInventory } = input;
    
    const result: OptimizationOutput = {
      placedItems: [],
      remainingItems: [],
      usedAirbags: { standard: 0, small: 0, "3d": 0, pallet_stabilizer: 0 },
      totalWeight: 0,
      frontAxleLoad: 0,
      rearAxleLoad: 0,
      spaceUtilization: 0,
      weightUtilization: 0,
      loadBalance: "Optimal",
      gaps: []
    };

    // Group items by type for optimized packing strategies
    const itemGroups = this.groupItemsByType(items);
    const placements: ItemPlacement[] = [];

    // Pack each item type with specific strategies
    for (const [itemType, groupItems] of Object.entries(itemGroups)) {
      const remainingFromGroup = this.packItemGroup(
        itemType, 
        groupItems, 
        truckConfig, 
        placements, 
        result
      );
      result.remainingItems.push(...remainingFromGroup);
    }

    // Find gaps and place airbags
    result.gaps = this.findGaps(placements, truckConfig);
    this.placeAirbags(result.gaps, airbagInventory, result.usedAirbags);

    // Calculate metrics
    this.calculateMetrics(result, truckConfig);

    return result;
  }

  private static groupItemsByType(items: Item[]): Record<string, Item[]> {
    const groups: Record<string, Item[]> = {};
    
    items.forEach(item => {
      const key = `${item.type}_${item.subtype}`;
      if (!groups[key]) groups[key] = [];
      
      // Expand items based on quantity
      for (let i = 0; i < item.number_of_items; i++) {
        groups[key].push({
          ...item,
          number_of_items: 1,
          weight_kg: item.weight_kg / item.number_of_items
        });
      }
    });
    
    return groups;
  }

  private static packItemGroup(
    itemType: string, 
    items: Item[], 
    truckConfig: TruckConfig, 
    placements: ItemPlacement[], 
    result: OptimizationOutput
  ): Item[] {
    if (items.length === 0) return [];

    const sampleItem = items[0];
    
    if (sampleItem.type === "pallet" && sampleItem.subtype === "europallet") {
      return this.packEuropallets(items, truckConfig, placements, result);
    } else if (sampleItem.type === "tank") {
      return this.packTanks(items, truckConfig, placements, result);
    } else if (sampleItem.type === "EWC") {
      return this.packEWCs(items, truckConfig, placements, result);
    } else {
      // Generic packing for other types
      return this.packGenericItems(items, truckConfig, placements, result);
    }
  }

  private static packEuropallets(
    items: Item[], 
    truckConfig: TruckConfig, 
    placements: ItemPlacement[], 
    result: OptimizationOutput
  ): Item[] {
    const palletCount = items.length;
    
    // EUR pallet dimensions: 120x80 cm
    const palletLength = 120;
    const palletWidth = 80;
    
    // Calculate optimal orientation based on count and truck dimensions
    const strategy = this.calculatePalletStrategy(palletCount, truckConfig);
    
    let currentY = this.getNextAvailableY(placements, truckConfig);
    let itemIndex = 0;
    
    for (const config of strategy.configurations) {
      const itemsToPlace = Math.min(config.count, items.length - itemIndex);
      if (itemsToPlace <= 0) break;
      
      // Place items according to configuration
      for (let row = 0; row < config.rows && itemIndex < items.length; row++) {
        let currentX = 0;
        let itemsInThisRow = 0;
        
        for (let col = 0; col < config.itemsPerRow && itemIndex < items.length && itemsInThisRow < config.itemsPerRow; col++) {
          const width = config.orientation === "long" ? palletLength : palletWidth;
          const height = config.orientation === "long" ? palletWidth : palletLength;
          
          // Check if we can fit this item in the truck
          if (currentX + width <= truckConfig.width && currentY + height <= truckConfig.length) {
            if (this.canPlaceAt(currentX, currentY, width, height, placements, truckConfig)) {
              const item = items[itemIndex];
              const placement: ItemPlacement = {
                x: currentX,
                y: currentY,
                width,
                height,
                weight: item.weight_kg,
                item
              };
              
              placements.push(placement);
              result.totalWeight += item.weight_kg;
              
              const zone = this.getZone(currentX, truckConfig);
              result.placedItems.push({
                item_id: item.item_id,
                type: item.type,
                subtype: item.subtype,
                x: currentX,
                y: currentY,
                width,
                height,
                weight: item.weight_kg,
                zone
              });
              
              itemIndex++;
              itemsInThisRow++;
              currentX += width;
            } else {
              break; // Can't place here, try next row
            }
          } else {
            break; // Doesn't fit, try next row
          }
        }
        
        // Move to next row
        const rowHeight = config.orientation === "long" ? palletWidth : palletLength;
        currentY += rowHeight;
        
        // If we've reached the configuration limit for this config, break
        if (itemIndex - (palletCount - items.length) >= config.count) {
          break;
        }
      }
    }
    
    // Return remaining unplaced items
    return items.slice(itemIndex);
  }

  private static calculatePalletStrategy(count: number, truckConfig: TruckConfig): {
    configurations: Array<{
      count: number;
      rows: number;
      itemsPerRow: number;
      orientation: "long" | "short";
    }>
  } {
    const truckWidth = truckConfig.width;
    
    // Pallet dimensions: 120cm (long) x 80cm (short)
    const palletLong = 120;
    const palletShort = 80;
    
    const configurations: Array<{
      count: number;
      rows: number;
      itemsPerRow: number;
      orientation: "long" | "short";
    }> = [];
    
    if (count === 3) {
      // 3 pallets: one row with longer sides along the length (short side across width)
      configurations.push({
        count: 3,
        rows: 1,
        itemsPerRow: 3,
        orientation: "short"
      });
    } else if (count === 4) {
      // 4 pallets: two rows with shorter sides along the length (long side across width)
      configurations.push({
        count: 4,
        rows: 2,
        itemsPerRow: 2,
        orientation: "long"
      });
    } else if (count === 5) {
      // 5 pallets: mixed strategy - row of 2 (long) + row of 3 (short)
      configurations.push({
        count: 2,
        rows: 1,
        itemsPerRow: 2,
        orientation: "long"
      });
      configurations.push({
        count: 3,
        rows: 1,
        itemsPerRow: 3,
        orientation: "short"
      });
    } else if (count === 6) {
      // 6 pallets: two rows of 3 (short orientation)
      configurations.push({
        count: 6,
        rows: 2,
        itemsPerRow: 3,
        orientation: "short"
      });
    } else if (count === 7) {
      // 7 pallets: row of 2 (long) + two rows of 3 (short) - but only 5 more fit
      configurations.push({
        count: 2,
        rows: 1,
        itemsPerRow: 2,
        orientation: "long"
      });
      configurations.push({
        count: 5,
        rows: 2,
        itemsPerRow: 3,
        orientation: "short"
      });
    } else if (count === 8) {
      // 8 pallets: two rows of 2 (long) + row of 3 (short) - but only 7 fit
      configurations.push({
        count: 4,
        rows: 2,
        itemsPerRow: 2,
        orientation: "long"
      });
      configurations.push({
        count: 3,
        rows: 1,
        itemsPerRow: 3,
        orientation: "short"
      });
    } else if (count === 9) {
      // 9 pallets: three rows of 3 (short orientation)
      configurations.push({
        count: 9,
        rows: 3,
        itemsPerRow: 3,
        orientation: "short"
      });
    } else if (count === 33) {
      // Special case: 32 pallets in short orientation (rows of 2) + 1 row of 1 in long orientation
      configurations.push({
        count: 32,
        rows: 16,
        itemsPerRow: 2,
        orientation: "short"
      });
      configurations.push({
        count: 1,
        rows: 1,
        itemsPerRow: 1,
        orientation: "long"
      });
    } else {
      // For larger quantities, calculate best fit
      const shortAcross = Math.floor(truckWidth / palletShort); // how many fit with short side across
      const longAcross = Math.floor(truckWidth / palletLong);   // how many fit with long side across
      
      if (shortAcross >= 2) {
        configurations.push({
          count: count,
          rows: Math.ceil(count / shortAcross),
          itemsPerRow: shortAcross,
          orientation: "short"
        });
      } else {
        configurations.push({
          count: count,
          rows: Math.ceil(count / longAcross),
          itemsPerRow: longAcross,
          orientation: "long"
        });
      }
    }
    
    return { configurations };
  }

  private static packTanks(
    items: Item[], 
    truckConfig: TruckConfig, 
    placements: ItemPlacement[], 
    result: OptimizationOutput
  ): Item[] {
    const remaining: Item[] = [];
    
    if (items.length === 0) return remaining;
    
    const sampleItem = items[0];
    const dimensions = this.getItemDimensions(sampleItem);
    if (!dimensions) return items;
    
    const tankDiameter = dimensions.width; // Tank width = height for circles
    let currentY = this.getNextAvailableY(placements, truckConfig);
    
    // Calculate centered distribution
    const tanksPerRow = Math.floor(truckConfig.width / tankDiameter);
    const totalRowWidth = tanksPerRow * tankDiameter;
    const centerOffset = (truckConfig.width - totalRowWidth) / 2;
    
    let itemIndex = 0;
    let rowIndex = 0;
    
    while (itemIndex < items.length && currentY + tankDiameter <= truckConfig.length) {
      const isEvenRow = rowIndex % 2 === 0;
      
      // For zigzag pattern, offset odd rows by half a tank diameter
      const zigzagOffset = isEvenRow ? 0 : tankDiameter / 2;
      const adjustedTanksPerRow = isEvenRow ? tanksPerRow : Math.max(1, tanksPerRow - 1);
      
      // Calculate starting X position for centered distribution with zigzag
      let startX = centerOffset + zigzagOffset;
      
      // Place tanks in this row
      for (let col = 0; col < adjustedTanksPerRow && itemIndex < items.length; col++) {
        const x = startX + col * tankDiameter;
        
        // Check if tank fits within truck bounds
        if (x + tankDiameter <= truckConfig.width) {
          if (this.canPlaceAt(x, currentY, tankDiameter, tankDiameter, placements, truckConfig)) {
            const item = items[itemIndex];
            const placement: ItemPlacement = {
              x,
              y: currentY,
              width: tankDiameter,
              height: tankDiameter,
              weight: item.weight_kg,
              item
            };
            
            placements.push(placement);
            result.totalWeight += item.weight_kg;
            
            const zone = this.getZone(x, truckConfig);
            result.placedItems.push({
              item_id: item.item_id,
              type: item.type,
              subtype: item.subtype,
              x,
              y: currentY,
              width: tankDiameter,
              height: tankDiameter,
              weight: item.weight_kg,
              zone
            });
            
            itemIndex++;
          }
        }
      }
      
      // Move to next row
      // For zigzag pattern, reduce row spacing to optimize space
      const rowSpacing = isEvenRow ? tankDiameter * 0.866 : tankDiameter * 0.866; // sqrt(3)/2 for optimal circle packing
      currentY += rowSpacing;
      rowIndex++;
    }
    
    return items.slice(itemIndex);
  }

  private static packEWCs(
    items: Item[], 
    truckConfig: TruckConfig, 
    placements: ItemPlacement[], 
    result: OptimizationOutput
  ): Item[] {
    // EWCs can be stacked up to 2 layers
    return this.packGenericItems(items, truckConfig, placements, result);
  }

  private static packGenericItems(
    items: Item[], 
    truckConfig: TruckConfig, 
    placements: ItemPlacement[], 
    result: OptimizationOutput
  ): Item[] {
    const remaining: Item[] = [];
    
    // Simple row-major packing for generic items
    let currentY = this.getNextAvailableY(placements, truckConfig);
    let rowHeight = 0;

    items.forEach(item => {
      const dimensions = this.getItemDimensions(item);
      if (!dimensions) {
        remaining.push(item);
        return;
      }

      let placed = false;
      let currentX = 0;

      // Try to place in current row
      while (currentX + dimensions.width <= truckConfig.width && !placed) {
        if (this.canPlaceAt(currentX, currentY, dimensions.width, dimensions.height, placements, truckConfig)) {
          const placement: ItemPlacement = {
            x: currentX,
            y: currentY,
            width: dimensions.width,
            height: dimensions.height,
            weight: item.weight_kg,
            item
          };

          placements.push(placement);
          rowHeight = Math.max(rowHeight, dimensions.height);
          result.totalWeight += item.weight_kg;
          placed = true;

          const zone = this.getZone(currentX, truckConfig);
          result.placedItems.push({
            item_id: item.item_id,
            type: item.type,
            subtype: item.subtype,
            x: currentX,
            y: currentY,
            width: dimensions.width,
            height: dimensions.height,
            weight: item.weight_kg,
            zone
          });
        } else {
          currentX += 20; // Grid increment
        }
      }

      // Try next row if not placed
      if (!placed) {
        currentY += rowHeight;
        rowHeight = 0;
        currentX = 0;

        if (currentY + dimensions.height <= truckConfig.length) {
          if (this.canPlaceAt(currentX, currentY, dimensions.width, dimensions.height, placements, truckConfig)) {
            const placement: ItemPlacement = {
              x: currentX,
              y: currentY,
              width: dimensions.width,
              height: dimensions.height,
              weight: item.weight_kg,
              item
            };

            placements.push(placement);
            rowHeight = dimensions.height;
            result.totalWeight += item.weight_kg;

            const zone = this.getZone(currentX, truckConfig);
            result.placedItems.push({
              item_id: item.item_id,
              type: item.type,
              subtype: item.subtype,
              x: currentX,
              y: currentY,
              width: dimensions.width,
              height: dimensions.height,
              weight: item.weight_kg,
              zone
            });
          } else {
            remaining.push(item);
          }
        } else {
          remaining.push(item);
        }
      }
    });

    return remaining;
  }

  private static getNextAvailableY(placements: ItemPlacement[], truckConfig: TruckConfig): number {
    if (placements.length === 0) return 0;
    
    // Find the maximum Y + height of all placed items
    let maxY = 0;
    placements.forEach(placement => {
      maxY = Math.max(maxY, placement.y + placement.height);
    });
    
    return maxY;
  }

  private static getItemDimensions(item: Item): { width: number; height: number } | null {
    const typeConfig = ITEM_CONFIGURATIONS[item.type as keyof typeof ITEM_CONFIGURATIONS];
    if (!typeConfig) return null;

    const subtypeConfig = typeConfig[item.subtype as keyof typeof typeConfig];
    if (!subtypeConfig) return null;

    if (item.type === "tank") {
      const tankConfig = subtypeConfig as any;
      return {
        width: tankConfig.diameter,
        height: tankConfig.diameter
      };
    } else {
      const itemConfig = subtypeConfig as any;
      return {
        width: itemConfig.width,
        height: itemConfig.height
      };
    }
  }

  private static getItemArea(item: Item): number {
    const dimensions = this.getItemDimensions(item);
    if (!dimensions) return 0;
    return dimensions.width * dimensions.height;
  }

  private static canPlaceAt(
    x: number,
    y: number,
    width: number,
    height: number,
    placements: ItemPlacement[],
    truckConfig: TruckConfig
  ): boolean {
    // Check truck boundaries
    if (x + width > truckConfig.width || y + height > truckConfig.length) {
      return false;
    }

    // Check collision with existing items
    for (const placement of placements) {
      if (this.rectanglesOverlap(
        x, y, width, height,
        placement.x, placement.y, placement.width, placement.height
      )) {
        return false;
      }
    }

    return true;
  }

  private static rectanglesOverlap(
    x1: number, y1: number, w1: number, h1: number,
    x2: number, y2: number, w2: number, h2: number
  ): boolean {
    return !(x1 >= x2 + w2 || x2 >= x1 + w1 || y1 >= y2 + h2 || y2 >= y1 + h1);
  }

  private static getZone(x: number, truckConfig: TruckConfig): string {
    const midPoint = truckConfig.width / 2;
    if (x < midPoint) return "Front";
    return "Rear";
  }

  private static findGaps(placements: ItemPlacement[], truckConfig: TruckConfig): Gap[] {
    const gaps: Gap[] = [];
    const gridSize = 20; // 20cm grid

    // Scan for gaps in a grid pattern
    for (let y = 0; y < truckConfig.length; y += gridSize) {
      for (let x = 0; x < truckConfig.width; x += gridSize) {
        if (!this.isOccupied(x, y, gridSize, gridSize, placements)) {
          gaps.push({
            x,
            y,
            width: gridSize,
            height: gridSize
          });
        }
      }
    }

    return gaps;
  }

  private static isOccupied(
    x: number,
    y: number,
    width: number,
    height: number,
    placements: ItemPlacement[]
  ): boolean {
    for (const placement of placements) {
      if (this.rectanglesOverlap(
        x, y, width, height,
        placement.x, placement.y, placement.width, placement.height
      )) {
        return true;
      }
    }
    return false;
  }

  private static placeAirbags(gaps: Gap[], inventory: AirbagUsage, used: AirbagUsage): void {
    // Simple airbag placement - fill largest gaps first
    const sortedGaps = gaps.sort((a, b) => (b.width * b.height) - (a.width * a.height));

    for (const gap of sortedGaps) {
      if (gap.width >= 80 && gap.height >= 60 && used.standard < inventory.standard) {
        used.standard++;
      } else if (gap.width >= 60 && gap.height >= 40 && used.small < inventory.small) {
        used.small++;
      }
    }
  }

  private static calculateMetrics(result: OptimizationOutput, truckConfig: TruckConfig): void {
    // Space utilization
    const totalArea = truckConfig.length * truckConfig.width;
    const usedArea = result.placedItems.reduce((sum, item) => sum + (item.width * item.height), 0);
    result.spaceUtilization = Math.round((usedArea / totalArea) * 100);

    // Weight utilization
    result.weightUtilization = Math.round((result.totalWeight / truckConfig.maxWeight) * 100);

    // Axle load distribution (simplified - based on longitudinal position)
    const frontAxlePosition = truckConfig.length * 0.2; // 20% from front
    const rearAxlePosition = truckConfig.length * 0.8; // 80% from front

    result.frontAxleLoad = 0;
    result.rearAxleLoad = 0;

    result.placedItems.forEach(item => {
      const itemCenter = item.y + item.height / 2;
      
      if (itemCenter < frontAxlePosition) {
        result.frontAxleLoad += item.weight;
      } else if (itemCenter > rearAxlePosition) {
        result.rearAxleLoad += item.weight;
      } else {
        // Distribute between axles based on position
        const distanceFromFront = itemCenter - frontAxlePosition;
        const axleDistance = rearAxlePosition - frontAxlePosition;
        const rearWeight = (distanceFromFront / axleDistance) * item.weight;
        const frontWeight = item.weight - rearWeight;
        
        result.frontAxleLoad += frontWeight;
        result.rearAxleLoad += rearWeight;
      }
    });

    // Check load balance
    const frontLimit = truckConfig.frontAxleLimit;
    const rearLimit = truckConfig.rearAxleLimit;

    if (result.frontAxleLoad > frontLimit || result.rearAxleLoad > rearLimit) {
      result.loadBalance = "Overloaded";
    } else if (Math.abs(result.frontAxleLoad - result.rearAxleLoad) > result.totalWeight * 0.3) {
      result.loadBalance = "Unbalanced";
    } else {
      result.loadBalance = "Optimal";
    }
  }
}
