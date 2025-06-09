import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { TruckConfigurator } from "@/components/truck-configurator";
import { ItemInputForm } from "@/components/item-input-form";
import { TruckVisualization } from "@/components/truck-visualization";
import { OptimizationResults } from "@/components/optimization-results";
import { EditableItemRow } from "@/components/editable-item-row";
import { Truck, List, Settings } from "lucide-react";
import { TRUCK_CONFIGURATIONS } from "@/lib/truck-configs";
import { PackingAlgorithm, type OptimizationOutput } from "@/lib/packing-algorithm";
import { apiRequest } from "@/lib/queryClient";
import type { Item, AirbagUsage } from "@shared/schema";

export default function Home() {
  const [selectedTruckType, setSelectedTruckType] = useState<string>("");
  const [airbagInventory, setAirbagInventory] = useState<AirbagUsage>({
    standard: 10,
    small: 20,
    "3d": 5,
    pallet_stabilizer: 15
  });
  const [optimizationResult, setOptimizationResult] = useState<OptimizationOutput | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Listen for item changes to clear optimization results
  useEffect(() => {
    const handleItemsChanged = () => {
      setOptimizationResult(null);
    };
    window.addEventListener('itemsChanged', handleItemsChanged);
    return () => window.removeEventListener('itemsChanged', handleItemsChanged);
  }, []);

  const { data: items = [], isLoading: itemsLoading } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/items/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Item removed",
        description: "Item has been removed from the order."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove item.",
        variant: "destructive"
      });
    }
  });

  const optimizeLoadingPlan = async () => {
    if (!selectedTruckType) {
      toast({
        title: "Truck type required",
        description: "Please select a truck type before optimizing.",
        variant: "destructive"
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "No items to optimize",
        description: "Please add some items before optimizing.",
        variant: "destructive"
      });
      return;
    }

    setIsOptimizing(true);
    try {
      const truckConfig = TRUCK_CONFIGURATIONS[selectedTruckType];
      const result = PackingAlgorithm.optimize({
        items,
        truckType: selectedTruckType,
        truckConfig,
        airbagInventory
      });

      setOptimizationResult(result);

      // Save optimization result to backend
      await apiRequest("POST", "/api/optimize", {
        truck_type: selectedTruckType,
        items: items,
        placed_items: result.placedItems,
        used_airbags: result.usedAirbags,
        total_weight: result.totalWeight,
        front_axle_load: result.frontAxleLoad,
        rear_axle_load: result.rearAxleLoad,
        space_utilization: result.spaceUtilization,
        weight_utilization: result.weightUtilization
      });

      toast({
        title: "Optimization complete",
        description: `Successfully optimized loading plan with ${result.spaceUtilization}% space utilization.`
      });
    } catch (error) {
      toast({
        title: "Optimization failed",
        description: "Failed to optimize loading plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleRemoveItem = (id: number) => {
    deleteItemMutation.mutate(id);
    // Clear optimization results when items change
    setOptimizationResult(null);
  };

  const handleClearAll = async () => {
    try {
      // Delete all items
      for (const item of items) {
        await apiRequest("DELETE", `/api/items/${item.id}`);
      }
      // Clear optimization results
      setOptimizationResult(null);
      // Refresh items list
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({
        title: "Cleared",
        description: "All items and results have been cleared."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear items.",
        variant: "destructive"
      });
    }
  };



  const selectedTruckConfig = selectedTruckType ? TRUCK_CONFIGURATIONS[selectedTruckType] : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Truck className="h-4 w-4 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">Truck Loading Plan Optimizer</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">Professional Logistics Suite</span>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Save Plan
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Input Forms */}
          <div className="lg:col-span-1 space-y-6">
            {/* Truck Configuration */}
            <TruckConfigurator
              selectedTruckType={selectedTruckType}
              onTruckTypeChange={setSelectedTruckType}
            />

            {/* Item Input Form */}
            <ItemInputForm />

            {/* Airbag Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Airbag Inventory
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="airbag-standard" className="text-xs">Standard</Label>
                    <Input
                      id="airbag-standard"
                      type="number"
                      min="0"
                      value={airbagInventory.standard}
                      onChange={(e) => setAirbagInventory(prev => ({ ...prev, standard: parseInt(e.target.value) || 0 }))}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="airbag-small" className="text-xs">Small</Label>
                    <Input
                      id="airbag-small"
                      type="number"
                      min="0"
                      value={airbagInventory.small}
                      onChange={(e) => setAirbagInventory(prev => ({ ...prev, small: parseInt(e.target.value) || 0 }))}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="airbag-3d" className="text-xs">3D</Label>
                    <Input
                      id="airbag-3d"
                      type="number"
                      min="0"
                      value={airbagInventory["3d"]}
                      onChange={(e) => setAirbagInventory(prev => ({ ...prev, "3d": parseInt(e.target.value) || 0 }))}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="airbag-stabilizer" className="text-xs">Pallet Stab.</Label>
                    <Input
                      id="airbag-stabilizer"
                      type="number"
                      min="0"
                      value={airbagInventory.pallet_stabilizer}
                      onChange={(e) => setAirbagInventory(prev => ({ ...prev, pallet_stabilizer: parseInt(e.target.value) || 0 }))}
                      className="text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>


          </div>

          {/* Right Panel - Visualization and Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button 
                onClick={handleClearAll}
                disabled={items.length === 0}
                variant="outline"
                className="px-6"
              >
                Clear All Items
              </Button>
              
              <Button 
                onClick={optimizeLoadingPlan}
                disabled={isOptimizing || !selectedTruckType || items.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white px-8"
              >
                {isOptimizing ? "Optimizing..." : "Optimize Loading Plan"}
              </Button>
            </div>
            {/* Items List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <List className="h-5 w-5 text-primary" />
                    Order Items
                  </span>
                  <Badge variant="secondary">{items.length} items</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {itemsLoading ? (
                  <div className="text-center py-4">Loading items...</div>
                ) : items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No items added yet. Use the form to add items.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Subtype</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Weight</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <EditableItemRow
                          key={item.id}
                          item={item}
                          onDelete={handleRemoveItem}
                          isDeleting={deleteItemMutation.isPending}
                        />
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Truck Visualization */}
            <TruckVisualization
              placedItems={optimizationResult?.placedItems || []}
              truckConfig={selectedTruckConfig}
              loading={isOptimizing}
            />

            {/* Optimization Results */}
            <OptimizationResults
              result={optimizationResult}
              truckConfig={selectedTruckConfig}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
