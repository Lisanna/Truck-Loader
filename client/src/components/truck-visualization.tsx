import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlacedItem } from "@shared/schema";
import type { TruckConfig } from "@/lib/truck-configs";

interface TruckVisualizationProps {
  placedItems: PlacedItem[];
  truckConfig: TruckConfig | null;
  loading?: boolean;
}

export function TruckVisualization({ placedItems, truckConfig, loading = false }: TruckVisualizationProps) {
  if (!truckConfig) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Loading Plan Visualization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-8 text-center">
            <p className="text-muted-foreground">Select a truck type to begin visualization</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Scale truck to fit in SVG - show length horizontally, width vertically
  const scale = 700 / truckConfig.length; // Scale to fit SVG width
  const svgHeight = Math.min(400, truckConfig.width * scale + 100);

  const getItemColor = (type: string) => {
    switch (type) {
      case "pallet": return { fill: "#3B82F6", stroke: "#1E40AF" };
      case "tank": return { fill: "#10B981", stroke: "#059669" };
      case "EWC": return { fill: "#8B5CF6", stroke: "#7C3AED" };
      default: return { fill: "#6B7280", stroke: "#374151" };
    }
  };

  const renderItem = (item: PlacedItem, index: number) => {
    // Convert coordinates: items are placed with X along truck width, Y along truck length
    // SVG shows truck length horizontally, width vertically
    const x = 50 + item.y * scale;  // item.y becomes SVG x (along truck length)
    const y = 50 + item.x * scale;  // item.x becomes SVG y (along truck width)
    const width = item.height * scale;  // item height becomes SVG width
    const height = item.width * scale;  // item width becomes SVG height
    const colors = getItemColor(item.type);

    if (item.type === "tank") {
      return (
        <g key={index}>
          <circle
            cx={x + width / 2}
            cy={y + height / 2}
            r={Math.min(width, height) / 2}
            fill={colors.fill}
            stroke={colors.stroke}
            strokeWidth="1"
            opacity="0.8"
          />
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs font-medium fill-white"
          >
            {item.item_id.slice(-2)}
          </text>
        </g>
      );
    }

    return (
      <g key={index}>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth="2"
          opacity="0.8"
          rx="2"
        />
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs font-medium fill-white"
        >
          {item.item_id.slice(-3)}
        </text>
      </g>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          Loading Plan Visualization
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span className="text-sm text-muted-foreground">Pallets</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-sm text-muted-foreground">Tanks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded" />
              <span className="text-sm text-muted-foreground">EWCs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded" />
              <span className="text-sm text-muted-foreground">Airbags</span>
            </div>
          </div>

          {/* SVG Visualization */}
          <div className="border border-border rounded-lg bg-muted p-4">
            <svg 
              width="100%" 
              height={svgHeight} 
              viewBox={`0 0 800 ${svgHeight}`}
              className="border border-border bg-background rounded"
            >
              {/* Truck outline - thick border */}
              <rect
                x="50"
                y="50"
                width={truckConfig.length * scale}
                height={truckConfig.width * scale}
                fill="hsl(var(--background))"
                stroke="hsl(var(--foreground))"
                strokeWidth="3"
                rx="4"
              />

              {/* Zone dividers */}
              {truckConfig.zones.map((zone, index) => (
                <g key={index}>
                  {index > 0 && (
                    <line
                      x1={50 + zone.x * scale}
                      y1="50"
                      x2={50 + zone.x * scale}
                      y2={50 + truckConfig.width * scale}
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth="1"
                      strokeDasharray="5,5"
                    />
                  )}
                  <text
                    x={50 + (zone.x + zone.width / 2) * scale}
                    y="40"
                    textAnchor="middle"
                    className="text-xs fill-muted-foreground"
                  >
                    {zone.name}
                  </text>
                </g>
              ))}

              {/* Axle positions */}
              <line
                x1={50 + truckConfig.length * 0.2 * scale}
                y1="40"
                x2={50 + truckConfig.length * 0.2 * scale}
                y2={50 + truckConfig.width * scale + 10}
                stroke="hsl(var(--destructive))"
                strokeWidth="2"
              />
              <text
                x={50 + truckConfig.length * 0.2 * scale}
                y="35"
                textAnchor="middle"
                className="text-xs fill-destructive"
              >
                Front Axle
              </text>

              <line
                x1={50 + truckConfig.length * 0.8 * scale}
                y1="40"
                x2={50 + truckConfig.length * 0.8 * scale}
                y2={50 + truckConfig.width * scale + 10}
                stroke="hsl(var(--destructive))"
                strokeWidth="2"
              />
              <text
                x={50 + truckConfig.length * 0.8 * scale}
                y="35"
                textAnchor="middle"
                className="text-xs fill-destructive"
              >
                Rear Axle
              </text>

              {/* Grid pattern */}
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path 
                    d="M 50 0 L 0 0 0 50" 
                    fill="none" 
                    stroke="hsl(var(--border))" 
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect
                x="50"
                y="50"
                width={truckConfig.length * scale}
                height={truckConfig.width * scale}
                fill="url(#grid)"
                opacity="0.3"
              />

              {/* Placed items */}
              {placedItems.map(renderItem)}

              {/* Measurements */}
              <text
                x={50 + (truckConfig.length * scale) / 2}
                y={50 + truckConfig.width * scale + 25}
                textAnchor="middle"
                className="text-sm fill-foreground"
              >
                {truckConfig.length} cm
              </text>
              <text
                x="25"
                y={50 + (truckConfig.width * scale) / 2}
                textAnchor="middle"
                className="text-sm fill-foreground"
                transform={`rotate(-90 25 ${50 + (truckConfig.width * scale) / 2})`}
              >
                {truckConfig.width} cm
              </text>
            </svg>
          </div>

          {/* Status */}
          <div className="bg-muted rounded-lg p-3">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center">
                Optimizing loading plan...
              </p>
            ) : placedItems.length > 0 ? (
              <p className="text-sm text-foreground text-center">
                ✓ Loaded {placedItems.length} items - Run optimization again to update
              </p>
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                Add items and run optimization to generate visualization
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
