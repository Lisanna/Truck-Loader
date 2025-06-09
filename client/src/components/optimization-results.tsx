import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, Scale, Shield, TrendingUp } from "lucide-react";
import type { OptimizationOutput } from "@/lib/packing-algorithm";
import type { TruckConfig } from "@/lib/truck-configs";

interface OptimizationResultsProps {
  result: OptimizationOutput | null;
  truckConfig: TruckConfig | null;
}

export function OptimizationResults({ result, truckConfig }: OptimizationResultsProps) {
  if (!result || !truckConfig) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5 text-primary" />
            Optimization Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Run optimization to see results</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getLoadBalanceColor = (balance: string) => {
    switch (balance) {
      case "Optimal": return "bg-green-100 text-green-800";
      case "Unbalanced": return "bg-yellow-100 text-yellow-800";
      case "Overloaded": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Load Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Load Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Weight</span>
                <span className="font-medium">{Math.round(result.totalWeight)} kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Weight Utilization</span>
                <span className="font-medium text-green-600">{result.weightUtilization}%</span>
              </div>
              <Progress value={result.weightUtilization} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Space Utilization</span>
                <span className="font-medium text-blue-600">{result.spaceUtilization}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items Placed</span>
                <span className="font-medium">{result.placedItems.length}</span>
              </div>
              <Progress value={result.spaceUtilization} className="h-2" />
            </div>
          </div>

          {result.remainingItems.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-sm text-orange-600">
                ⚠️ {result.remainingItems.length} items could not be placed
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Axle Load Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Axle Load Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm font-medium mb-1">
                <span>Front Axle</span>
                <span>{Math.round(result.frontAxleLoad)} kg / {truckConfig.frontAxleLimit} kg</span>
              </div>
              <Progress 
                value={(result.frontAxleLoad / truckConfig.frontAxleLimit) * 100} 
                className="h-2"
              />
              <div className="text-xs mt-1">
                {result.frontAxleLoad <= truckConfig.frontAxleLimit ? (
                  <span className="text-green-600">✓ Within limits</span>
                ) : (
                  <span className="text-red-600">⚠️ Overloaded</span>
                )}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-medium mb-1">
                <span>Rear Axle</span>
                <span>{Math.round(result.rearAxleLoad)} kg / {truckConfig.rearAxleLimit} kg</span>
              </div>
              <Progress 
                value={(result.rearAxleLoad / truckConfig.rearAxleLimit) * 100} 
                className="h-2"
              />
              <div className="text-xs mt-1">
                {result.rearAxleLoad <= truckConfig.rearAxleLimit ? (
                  <span className="text-green-600">✓ Within limits</span>
                ) : (
                  <span className="text-red-600">⚠️ Overloaded</span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Load Balance</span>
              <Badge className={getLoadBalanceColor(result.loadBalance)}>
                {result.loadBalance}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Airbag Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Airbag Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{result.usedAirbags.standard}</div>
              <div className="text-sm text-muted-foreground">Standard</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{result.usedAirbags.small}</div>
              <div className="text-sm text-muted-foreground">Small</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{result.usedAirbags["3d"]}</div>
              <div className="text-sm text-muted-foreground">3D</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{result.usedAirbags.pallet_stabilizer}</div>
              <div className="text-sm text-muted-foreground">Pallet Stab.</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Remaining Capacity */}
      <Card>
        <CardHeader>
          <CardTitle>Remaining Capacity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Volume</span>
              <span className="text-sm font-medium">{100 - result.spaceUtilization}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Weight</span>
              <span className="text-sm font-medium">{Math.round(truckConfig.maxWeight - result.totalWeight)} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Floor Area</span>
              <span className="text-sm font-medium">
                {Math.round(((truckConfig.length * truckConfig.width) * (100 - result.spaceUtilization) / 100) / 10000)} m²
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
