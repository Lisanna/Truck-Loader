import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Truck } from "lucide-react";
import { TRUCK_CONFIGURATIONS } from "@/lib/truck-configs";

interface TruckConfiguratorProps {
  selectedTruckType: string;
  onTruckTypeChange: (truckType: string) => void;
}

export function TruckConfigurator({ selectedTruckType, onTruckTypeChange }: TruckConfiguratorProps) {
  const selectedConfig = selectedTruckType ? TRUCK_CONFIGURATIONS[selectedTruckType] : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          Truck Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="truck-type">Truck Type</Label>
          <Select value={selectedTruckType} onValueChange={onTruckTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select truck type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TRUCK_CONFIGURATIONS).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedConfig && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="truck-length">Length (cm)</Label>
              <Input
                id="truck-length"
                value={selectedConfig.length}
                readOnly
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="truck-width">Width (cm)</Label>
              <Input
                id="truck-width"
                value={selectedConfig.width}
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="max-load">Max Load (kg)</Label>
              <Input
                id="max-load"
                value={selectedConfig.maxWeight}
                readOnly
                className="bg-muted"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
