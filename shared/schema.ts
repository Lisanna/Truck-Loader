import { pgTable, text, serial, integer, real, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  item_id: text("item_id").notNull(),
  type: text("type").notNull(), // 'pallet', 'tank', 'EWC'
  subtype: text("subtype").notNull(),
  number_of_items: integer("number_of_items").notNull(),
  weight_kg: real("weight_kg").notNull(),
  stackable: boolean("stackable").notNull().default(false),
});

export const optimizationResults = pgTable("optimization_results", {
  id: serial("id").primaryKey(),
  truck_type: text("truck_type").notNull(),
  items: jsonb("items").notNull(), // Array of items
  placed_items: jsonb("placed_items").notNull(), // Array of placed items with positions
  used_airbags: jsonb("used_airbags").notNull(), // Airbag usage statistics
  total_weight: real("total_weight").notNull(),
  front_axle_load: real("front_axle_load").notNull(),
  rear_axle_load: real("rear_axle_load").notNull(),
  space_utilization: real("space_utilization").notNull(),
  weight_utilization: real("weight_utilization").notNull(),
  created_at: text("created_at").notNull().default('now()'),
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  stackable: true,
});

export const insertOptimizationResultSchema = createInsertSchema(optimizationResults).omit({
  id: true,
  created_at: true,
});

export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;
export type InsertOptimizationResult = z.infer<typeof insertOptimizationResultSchema>;
export type OptimizationResult = typeof optimizationResults.$inferSelect;

// Additional types for the frontend
export const airbagUsageSchema = z.object({
  standard: z.number(),
  small: z.number(),
  "3d": z.number(),
  pallet_stabilizer: z.number(),
});

export const placedItemSchema = z.object({
  item_id: z.string(),
  type: z.string(),
  subtype: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  weight: z.number(),
  zone: z.string(),
});

export type AirbagUsage = z.infer<typeof airbagUsageSchema>;
export type PlacedItem = z.infer<typeof placedItemSchema>;
