export interface TruckZone {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
}

export interface TruckConfig {
  name: string;
  length: number; // cm
  width: number; // cm
  height: number; // cm
  maxWeight: number; // kg
  frontAxleLimit: number; // kg
  rearAxleLimit: number; // kg
  zones: TruckZone[];
}

export const TRUCK_CONFIGURATIONS: Record<string, TruckConfig> = {
  pianale: {
    name: "Pianale (13.6m x 2.48m)",
    length: 1360,
    width: 248,
    height: 270,
    maxWeight: 24000,
    frontAxleLimit: 7000,
    rearAxleLimit: 11000,
    zones: [
      { x: 0, y: 0, width: 680, height: 248, name: "Front Zone" },
      { x: 680, y: 0, width: 680, height: 248, name: "Rear Zone" }
    ]
  },
  frigo: {
    name: "Frigo (13.6m x 2.48m)",
    length: 1360,
    width: 248,
    height: 250,
    maxWeight: 24000,
    frontAxleLimit: 7000,
    rearAxleLimit: 11000,
    zones: [
      { x: 0, y: 0, width: 680, height: 248, name: "Front Zone" },
      { x: 680, y: 0, width: 680, height: 248, name: "Rear Zone" }
    ]
  },
  container: {
    name: "Container (12m x 2.35m)",
    length: 1200,
    width: 235,
    height: 259,
    maxWeight: 28000,
    frontAxleLimit: 8000,
    rearAxleLimit: 12000,
    zones: [
      { x: 0, y: 0, width: 600, height: 235, name: "Front Zone" },
      { x: 600, y: 0, width: 600, height: 235, name: "Rear Zone" }
    ]
  },
  rimorchio: {
    name: "Rimorchio (13.6m x 2.48m)",
    length: 1360,
    width: 248,
    height: 270,
    maxWeight: 24000,
    frontAxleLimit: 7000,
    rearAxleLimit: 11000,
    zones: [
      { x: 0, y: 0, width: 680, height: 248, name: "Front Zone" },
      { x: 680, y: 0, width: 680, height: 248, name: "Rear Zone" }
    ]
  }
};

export interface ItemDimensions {
  width: number;
  height: number;
  stackable?: boolean;
  maxLayers?: number;
}

export interface TankDimensions {
  diameter: number;
  stackable: false;
}

export const ITEM_CONFIGURATIONS = {
  pallet: {
    europallet: { width: 120, height: 80, stackable: false } as ItemDimensions,
    custom: { width: 100, height: 100, stackable: false } as ItemDimensions // Default for custom
  },
  tank: {
    small: { diameter: 60, stackable: false } as TankDimensions,
    big: { diameter: 100, stackable: false } as TankDimensions
  },
  EWC: {
    "800x1200": { width: 80, height: 120, stackable: true, maxLayers: 2 } as ItemDimensions,
    "1000x1200": { width: 100, height: 120, stackable: true, maxLayers: 2 } as ItemDimensions
  }
};

export interface AirbagConfig {
  width: number;
  height: number;
  depth: number;
}

export const AIRBAG_CONFIGURATIONS: Record<string, AirbagConfig> = {
  standard: { width: 240, height: 100, depth: 80 },
  small: { width: 80, height: 60, depth: 20 },
  "3d": { width: 240, height: 100, depth: 80 },
  pallet_stabilizer: { width: 120, height: 80, depth: 5 }
};
