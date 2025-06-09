import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertItemSchema, insertOptimizationResultSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Items endpoints
  app.get("/api/items", async (req, res) => {
    try {
      const items = await storage.getItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.post("/api/items", async (req, res) => {
    try {
      const validatedData = insertItemSchema.parse(req.body);
      const item = await storage.createItem(validatedData);
      res.json(item);
    } catch (error) {
      res.status(400).json({ message: "Invalid item data" });
    }
  });

  app.delete("/api/items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteItem(id);
      if (deleted) {
        res.json({ message: "Item deleted successfully" });
      } else {
        res.status(404).json({ message: "Item not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete item" });
    }
  });

  // Optimization endpoints
  app.post("/api/optimize", async (req, res) => {
    try {
      const validatedData = insertOptimizationResultSchema.parse(req.body);
      const result = await storage.createOptimizationResult(validatedData);
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid optimization data" });
    }
  });

  app.get("/api/optimization-results", async (req, res) => {
    try {
      const results = await storage.getOptimizationResults();
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch optimization results" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
