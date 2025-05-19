import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getHealthAdvice, addToKnowledgeBase } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // AI Chat endpoint
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message || typeof message !== "string") {
        return res.status(400).json({ 
          error: "Invalid request. Message must be a string." 
        });
      }
      
      // Get response from OpenAI with our custom knowledge base
      const response = await getHealthAdvice(message);
      
      // Store the conversation in database
      await storage.addChatMessage(1, "user", message);
      await storage.addChatMessage(1, "assistant", response);
      
      return res.json({ 
        role: "assistant", 
        content: response 
      });
    } catch (error) {
      console.error("Error in AI chat:", error);
      return res.status(500).json({ 
        error: "Failed to process your request" 
      });
    }
  });
  
  // Endpoint to add new content to the AI knowledge base
  app.post("/api/ai/knowledge", async (req, res) => {
    try {
      const { category, content } = req.body;
      
      if (!category || !content || typeof category !== "string" || typeof content !== "string") {
        return res.status(400).json({ 
          error: "Invalid request. Both category and content must be provided as strings." 
        });
      }
      
      // Add content to knowledge base
      const result = addToKnowledgeBase(category, content);
      
      return res.json(result);
    } catch (error) {
      console.error("Error adding to knowledge base:", error);
      return res.status(500).json({ 
        error: "Failed to add to knowledge base" 
      });
    }
  });

  // User endpoints
  app.get("/api/user", async (req, res) => {
    try {
      // For now, we'll return the default user
      // In a production app, this would use authentication
      let user = await storage.getUser(1);
      
      if (!user) {
        // Create default user if not exists
        user = await storage.createUser({
          username: "liz",
          password: "password123", // In a real app, this would be properly hashed
          displayName: "Liz",
          email: "liz@example.com",
          cancerType: "breast",
          cancerStage: "stage2",
          bio: "I'm on a journey to healing through holistic wellness and conventional treatment.",
          diagnosis_date: "2023-01-15"
        });
      }
      
      return res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ error: "Failed to fetch user" });
    }
  });
  
  // Update user profile
  app.patch("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = parseInt(id, 10);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      // Get the existing user
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Update the user with the provided fields
      const updatedUser = await storage.updateUser(userId, req.body);
      return res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      return res.status(500).json({ error: "Failed to update user profile" });
    }
  });

  // Medical tracking endpoints
  app.get("/api/medical-records", (req, res) => {
    // Will be implemented with actual storage in a production app
    return res.json([]);
  });

  // Appointments endpoints
  app.get("/api/appointments", (req, res) => {
    // Will be implemented with actual storage in a production app
    const appointments = [
      {
        id: 1,
        title: "Oncology Appointment",
        description: "Regular checkup with oncologist",
        date: "2023-05-17",
        time: "9:30 AM - 10:30 AM",
        location: "Memorial Hospital",
        person: "Dr. Sarah Thompson"
      },
      {
        id: 2,
        title: "Nutrition Consultation",
        description: "Dietary planning session",
        date: "2023-05-19",
        time: "2:00 PM - 3:00 PM",
        location: "Wellness Center",
        person: "Maria Rodriguez, RD"
      },
      {
        id: 3,
        title: "Support Group",
        description: "Weekly cancer support meeting",
        date: "2023-05-22",
        time: "6:00 PM - 7:30 PM",
        location: "Community Center",
        person: "Community Center"
      }
    ];
    
    return res.json(appointments);
  });

  const httpServer = createServer(app);
  return httpServer;
}
