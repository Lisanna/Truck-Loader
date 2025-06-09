import { items, optimizationResults, type Item, type InsertItem, type OptimizationResult, type InsertOptimizationResult } from "@shared/schema";

export interface IStorage {
  // Items
  createItem(item: InsertItem): Promise<Item>;
  getItems(): Promise<Item[]>;
  deleteItem(id: number): Promise<boolean>;
  
  // Optimization Results
  createOptimizationResult(result: InsertOptimizationResult): Promise<OptimizationResult>;
  getOptimizationResults(): Promise<OptimizationResult[]>;
  getOptimizationResult(id: number): Promise<OptimizationResult | undefined>;
}

export class MemStorage implements IStorage {
  private items: Map<number, Item>;
  private optimizationResults: Map<number, OptimizationResult>;
  private currentItemId: number;
  private currentResultId: number;

  constructor() {
    this.items = new Map();
    this.optimizationResults = new Map();
    this.currentItemId = 1;
    this.currentResultId = 1;
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const id = this.currentItemId++;
    
    // Determine stackable based on item type
    let stackable = false;
    if (insertItem.type === "EWC") {
      stackable = true;
    }
    
    const item: Item = { 
      ...insertItem, 
      id,
      stackable
    };
    
    this.items.set(id, item);
    return item;
  }

  async getItems(): Promise<Item[]> {
    return Array.from(this.items.values());
  }

  async deleteItem(id: number): Promise<boolean> {
    return this.items.delete(id);
  }

  async createOptimizationResult(insertResult: InsertOptimizationResult): Promise<OptimizationResult> {
    const id = this.currentResultId++;
    const result: OptimizationResult = {
      ...insertResult,
      id,
      created_at: new Date().toISOString()
    };
    
    this.optimizationResults.set(id, result);
    return result;
  }

  async getOptimizationResults(): Promise<OptimizationResult[]> {
    return Array.from(this.optimizationResults.values());
  }

  async getOptimizationResult(id: number): Promise<OptimizationResult | undefined> {
    return this.optimizationResults.get(id);
  }
}

export const storage = new MemStorage();
