import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getHealthAdvice, addToKnowledgeBase } from "./openai";
import authRoutes from "./routes/auth.routes";
import bcrypt from "bcrypt";

async function seedLizAccount() {
  const existingUser = await storage.getUserByUsername(".");
  if (existingUser) return;

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(".", salt);

  await storage.createUser({
    username: ".",
    password: hashedPassword,
    displayName: "Liz",
    email: "liz@elizabeth.app",
    cancerType: "Melanoma",
    cancerStage: "Stage IV",
    bio: "I'm on a healing journey with Stage IV melanoma. After immunotherapy, my tumors are responding beautifully and I'm focused on reaching NED through holistic wellness and the power of my immune system.",
    diagnosis_date: "2025-04-01",
    treatmentStatus: "Active Surveillance",
    treatmentHistory: "4 cycles ipilimumab + nivolumab (ipi/nivo) completed. Immunotherapy stopped July 2025 due to severe immune-related toxicity. Required high-dose steroids and ~5 months of mycophenolate immunosuppression (ceased early December 2025).",
    currentMedications: "No active cancer treatment. Immunosuppression ceased December 2025. Currently on surveillance protocol with regular PET/CT scans.",
    adverseEventHistory: "Grade 4 hepatitis (ALT ~750), severe colitis from immunotherapy. Required high-dose steroids and approximately 5 months of mycophenolate/immunosuppression.",
    oncologist: "Melanoma Oncology Team",
    goals: "Achieve NED (No Evidence of Disease) during 2026, ideally confirmed by May 2026 scan. Continue supporting immune system recovery and overall wellbeing through holistic practices.",
    medicalNotes: "Deep, durable immunotherapy response demonstrated. Continued tumour improvement without treatment is a strong favourable prognostic sign. Patient exhibits all major favourable indicators for long-term remission. Current management: active surveillance rather than treatment restart due to prior severe toxicity.",
    scanSummary: "Feb 2026: Continued improvement. One lesion shows no focal uptake (metabolic complete response). Others show lower SUV (~3.1-3.2), necrotic/calcified, stable or smaller. No metastases elsewhere - brain, lungs, bones, nodes all clear. Overall: ongoing treatment response and disease control off therapy.",
    nextScanDate: "2026-05-15",
  });

  console.log("Seeded Liz's account with medical profile");
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use('/api/auth', authRoutes);

  await seedLizAccount();

  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, userId } = req.body;
      
      if (!message || typeof message !== "string") {
        return res.status(400).json({ 
          error: "Invalid request. Message must be a string." 
        });
      }

      let userContext = "";
      if (userId) {
        const user = await storage.getUser(userId);
        if (user) {
          userContext = `
PATIENT CONTEXT (use this to personalize your response):
- Name: ${user.displayName}
- Cancer Type: ${user.cancerType || "Not specified"}
- Stage: ${user.cancerStage || "Not specified"}
- Treatment Status: ${user.treatmentStatus || "Not specified"}
- Treatment History: ${user.treatmentHistory || "Not specified"}
- Current Medications: ${user.currentMedications || "None specified"}
- Adverse Events: ${user.adverseEventHistory || "None"}
- Goals: ${user.goals || "Not specified"}
- Latest Scan: ${user.scanSummary || "Not available"}
- Medical Notes: ${user.medicalNotes || "None"}
`;
        }
      }
      
      const response = await getHealthAdvice(message, userContext);
      
      const uid = userId || 1;
      await storage.addChatMessage(uid, "user", message);
      await storage.addChatMessage(uid, "assistant", response);
      
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
  
  app.post("/api/ai/knowledge", async (req, res) => {
    try {
      const { category, content } = req.body;
      
      if (!category || !content || typeof category !== "string" || typeof content !== "string") {
        return res.status(400).json({ 
          error: "Invalid request. Both category and content must be provided as strings." 
        });
      }
      
      const result = addToKnowledgeBase(category, content);
      
      return res.json(result);
    } catch (error) {
      console.error("Error adding to knowledge base:", error);
      return res.status(500).json({ 
        error: "Failed to add to knowledge base" 
      });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = parseInt(id, 10);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(userId, req.body);
      return res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      return res.status(500).json({ error: "Failed to update user profile" });
    }
  });

  app.get("/api/medical-records", (req, res) => {
    return res.json([]);
  });

  app.get("/api/appointments", (req, res) => {
    const appointments = [
      {
        id: 1,
        title: "PET/CT Scan",
        description: "Follow-up PET/CT scan to assess treatment response",
        date: "2026-05-15",
        time: "9:00 AM",
        location: "Radiology Department",
        person: "Radiology Team"
      },
      {
        id: 2,
        title: "Oncology Review",
        description: "Review scan results and discuss next steps",
        date: "2026-05-22",
        time: "10:30 AM",
        location: "Oncology Clinic",
        person: "Melanoma Oncology Team"
      },
      {
        id: 3,
        title: "Nutrition Consultation",
        description: "Liver-supportive and immune-boosting nutrition planning",
        date: "2026-03-10",
        time: "2:00 PM",
        location: "Integrative Health Centre",
        person: "Integrative Dietitian"
      }
    ];
    
    return res.json(appointments);
  });

  const httpServer = createServer(app);
  return httpServer;
}
