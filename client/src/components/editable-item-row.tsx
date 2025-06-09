import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Edit, Trash2 } from "lucide-react";
import { insertItemSchema, type InsertItem, type Item } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface EditableItemRowProps {
  item: Item;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

const subtypeOptions = {
  pallet: [
    { value: "europallet", label: "EUR Pallet (120x80cm)" },
    { value: "custom", label: "Custom Dimensions" }
  ],
  tank: [
    { value: "small", label: "Small Tank (60cm ⌀)" },
    { value: "big", label: "Big Tank (100cm ⌀)" }
  ],
  EWC: [
    { value: "800x1200", label: "EWC 800x1200cm" },
    { value: "1000x1200", label: "EWC 1000x1200cm" }
  ]
};

export function EditableItemRow({ item, onDelete, isDeleting }: EditableItemRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertItem>({
    resolver: zodResolver(insertItemSchema),
    defaultValues: {
      item_id: item.item_id,
      type: item.type,
      subtype: item.subtype,
      number_of_items: item.number_of_items,
      weight_kg: item.weight_kg
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: async (data: InsertItem) => {
      // Delete old item and create new one (since we're using in-memory storage)
      await apiRequest("DELETE", `/api/items/${item.id}`);
      const response = await apiRequest("POST", "/api/items", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Item updated",
        description: "Item has been updated successfully."
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      // Trigger re-render of parent to clear optimization results
      window.dispatchEvent(new CustomEvent('itemsChanged'));
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update item. Please try again.",
        variant: "destructive"
      });
    }
  });

  const getItemTypeColor = (type: string) => {
    switch (type) {
      case "pallet": return "bg-blue-100 text-blue-800";
      case "tank": return "bg-green-100 text-green-800";
      case "EWC": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleSave = (data: InsertItem) => {
    updateItemMutation.mutate(data);
  };

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  const handleTypeChange = (type: string) => {
    form.setValue("type", type);
    form.setValue("subtype", "");
  };

  if (isEditing) {
    return (
      <TableRow>
        <TableCell>
          <Input
            {...form.register("item_id")}
            className="h-8"
          />
        </TableCell>
        <TableCell>
          <Select 
            value={form.watch("type")} 
            onValueChange={handleTypeChange}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pallet">Pallet</SelectItem>
              <SelectItem value="tank">Tank</SelectItem>
              <SelectItem value="EWC">EWC</SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          <Select 
            value={form.watch("subtype")} 
            onValueChange={(value) => form.setValue("subtype", value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {form.watch("type") && subtypeOptions[form.watch("type") as keyof typeof subtypeOptions]?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          <Input
            {...form.register("number_of_items", { 
              valueAsNumber: true,
              min: 1 
            })}
            type="number"
            min="1"
            className="h-8 text-right"
          />
        </TableCell>
        <TableCell>
          <Input
            {...form.register("weight_kg", { 
              valueAsNumber: true,
              min: 0 
            })}
            type="number"
            min="0"
            step="0.1"
            className="h-8 text-right"
          />
        </TableCell>
        <TableCell>
          <div className="flex gap-1 justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={form.handleSubmit(handleSave)}
              disabled={updateItemMutation.isPending}
              className="h-8 w-8 p-0"
            >
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={updateItemMutation.isPending}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{item.item_id}</TableCell>
      <TableCell>
        <Badge className={getItemTypeColor(item.type)}>
          {item.type}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">{item.subtype}</TableCell>
      <TableCell className="text-right">{item.number_of_items}</TableCell>
      <TableCell className="text-right">{item.weight_kg} kg</TableCell>
      <TableCell>
        <div className="flex gap-1 justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4 text-blue-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(item.id)}
            disabled={isDeleting}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}