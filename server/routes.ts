import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getHealthAdvice, addToKnowledgeBase, generateMealPlan, getMealSuggestion, getDateNightIdeas } from "./openai";
import authRoutes from "./routes/auth.routes";
import bcrypt from "bcrypt";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seedLizAccount() {
  const lizProfile = {
    cancerType: "Stage IV Melanoma",
    cancerStage: "Stage IV",
    treatmentStatus: "Active Surveillance",
    treatmentHistory: "4 cycles ipilimumab + nivolumab (ipi/nivo) completed Apr-Jul 2025. Immunotherapy stopped July 2025 due to severe immune-related toxicity. Required high-dose steroids and ~5 months of mycophenolate immunosuppression (ceased early December 2025).",
    currentMedications: "No active cancer treatment. Immunosuppression ceased December 2025. Currently on surveillance protocol with regular PET/CT scans.",
    adverseEventHistory: "Grade 4 hepatitis (ALT ~750), severe colitis from immunotherapy. Required high-dose steroids and approximately 5 months of mycophenolate/immunosuppression.",
    oncologist: "Melanoma Oncology Team",
    goals: "Achieve NED (No Evidence of Disease) during 2026, ideally confirmed by May 2026 scan. Continue supporting immune system recovery and overall wellbeing through holistic practices.",
    medicalNotes: "Deep, durable immunotherapy response demonstrated. Continued tumour improvement without treatment is a strong favourable prognostic sign. Patient exhibits all major favourable indicators for long-term remission.",
    scanSummary: "Feb 2026 PET/CT: Continued improvement off therapy. Tumour 1: 60x51mm SUV 3.2 (was 82x57 SUV 7.6). Tumour 2: 51x42mm no focal uptake (was 67x58 SUV 9.8). Tumour 3: 42x35mm SUV 3.1 (was 49x49 SUV 9.8). No new disease — brain, lungs, bones, nodes all clear.",
    nextScanDate: "2026-05-15",
    diagnosis_date: "2025-04-22",
    bio: "On a healing journey with Stage IV melanoma. After immunotherapy, my tumours are responding beautifully. Focused on reaching NED through holistic wellness and the power of my immune system.",
  };

  const existingUser = await storage.getUserByUsername("Liz");
  const oldUser = !existingUser ? await storage.getUserByUsername(".") : null;

  if (existingUser) {
    await storage.updateUser(existingUser.id, lizProfile);
    const validPassword = await bcrypt.compare("Cookie", existingUser.password);
    if (!validPassword) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("Cookie", salt);
      await db.update(users).set({ password: hashedPassword }).where(eq(users.id, existingUser.id));
    }
    const scans = await storage.listScanResults(existingUser.id);
    if (scans.length === 0) {
      await seedScanData(existingUser.id);
    }
    return;
  }

  if (oldUser) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("Cookie", salt);
    await db.update(users).set({ ...lizProfile, username: "Liz", password: hashedPassword }).where(eq(users.id, oldUser.id));
    const scans = await storage.listScanResults(oldUser.id);
    if (scans.length === 0) {
      await seedScanData(oldUser.id);
    }
    console.log("Migrated old Liz account (./.) to Liz/Cookie");
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("Cookie", salt);

  const user = await storage.createUser({
    username: "Liz",
    password: hashedPassword,
    displayName: "Liz",
    email: "liz@elizabeth.app",
    cancerType: "Stage IV Melanoma",
    cancerStage: "Stage IV",
    bio: "On a healing journey with Stage IV melanoma. After immunotherapy, my tumours are responding beautifully. Focused on reaching NED through holistic wellness and the power of my immune system.",
    diagnosis_date: "2025-04-22",
    treatmentStatus: "Active Surveillance",
    treatmentHistory: "4 cycles ipilimumab + nivolumab (ipi/nivo) completed Apr-Jul 2025. Immunotherapy stopped July 2025 due to severe immune-related toxicity. Required high-dose steroids and ~5 months of mycophenolate immunosuppression (ceased early December 2025).",
    currentMedications: "No active cancer treatment. Immunosuppression ceased December 2025. Currently on surveillance protocol with regular PET/CT scans.",
    adverseEventHistory: "Grade 4 hepatitis (ALT ~750), severe colitis from immunotherapy. Required high-dose steroids and approximately 5 months of mycophenolate/immunosuppression.",
    oncologist: "Melanoma Oncology Team",
    goals: "Achieve NED (No Evidence of Disease) during 2026, ideally confirmed by May 2026 scan. Continue supporting immune system recovery and overall wellbeing through holistic practices.",
    medicalNotes: "Deep, durable immunotherapy response demonstrated. Continued tumour improvement without treatment is a strong favourable prognostic sign. Patient exhibits all major favourable indicators for long-term remission.",
    scanSummary: "Feb 2026 PET/CT: Continued improvement off therapy. Tumour 1: 60x51mm SUV 3.2 (was 82x57 SUV 7.6). Tumour 2: 51x42mm no focal uptake (was 67x58 SUV 9.8). Tumour 3: 42x35mm SUV 3.1 (was 49x49 SUV 9.8). No new disease — brain, lungs, bones, nodes all clear.",
    nextScanDate: "2026-05-15",
  });

  await seedScanData(user.id);
  console.log("Seeded Liz's account with medical profile and scan data");
}

async function seedScanData(userId: number) {
  const scanData = [
    { scanDate: "2025-04-22", scanLabel: "Baseline (before treatment)", tumours: [
      { label: "Tumour 1", sizeX: 82, sizeY: 57, suvMax: 7.6 },
      { label: "Tumour 2", sizeX: 67, sizeY: 58, suvMax: 9.8 },
      { label: "Tumour 3", sizeX: 49, sizeY: 49, suvMax: 9.8 },
    ]},
    { scanDate: "2025-08-05", scanLabel: "Post-immunotherapy (4 cycles ipi/nivo)", tumours: [
      { label: "Tumour 1", sizeX: 65, sizeY: 54, suvMax: 4.3 },
      { label: "Tumour 2", sizeX: 60, sizeY: 49, suvMax: 3.5 },
      { label: "Tumour 3", sizeX: 45, sizeY: 36, suvMax: 4.3 },
    ]},
    { scanDate: "2026-02-03", scanLabel: "Surveillance (no treatment since Jul 2025)", tumours: [
      { label: "Tumour 1", sizeX: 60, sizeY: 51, suvMax: 3.2 },
      { label: "Tumour 2", sizeX: 51, sizeY: 42, suvMax: null },
      { label: "Tumour 3", sizeX: 42, sizeY: 35, suvMax: 3.1 },
    ]},
  ];

  for (const scan of scanData) {
    for (const tumour of scan.tumours) {
      await storage.createScanResult({
        userId,
        scanDate: scan.scanDate,
        scanLabel: scan.scanLabel,
        tumourLabel: tumour.label,
        sizeX: tumour.sizeX,
        sizeY: tumour.sizeY,
        suvMax: tumour.suvMax,
        notes: null,
      });
    }
  }
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
  
  app.post("/api/ai/meal-plan", async (req, res) => {
    try {
      const { userId } = req.body;
      let userContext = "";
      if (userId) {
        const user = await storage.getUser(userId);
        if (user) {
          userContext = `
PATIENT CONTEXT:
- Name: ${user.displayName}
- Cancer Type: ${user.cancerType || "Not specified"}
- Stage: ${user.cancerStage || "Not specified"}
- Treatment Status: ${user.treatmentStatus || "Not specified"}
- Treatment History: ${user.treatmentHistory || "Not specified"}
- Adverse Events: ${user.adverseEventHistory || "None"}
- Goals: ${user.goals || "Not specified"}
`;
        }
      }
      const plan = await generateMealPlan(userContext);
      return res.json({ content: plan });
    } catch (error) {
      console.error("Error generating meal plan:", error);
      return res.status(500).json({ error: "Failed to generate meal plan" });
    }
  });

  app.post("/api/ai/meal-suggestion", async (req, res) => {
    try {
      const { mealType, userId } = req.body;
      if (!mealType) {
        return res.status(400).json({ error: "mealType is required" });
      }
      let userContext = "";
      if (userId) {
        const user = await storage.getUser(userId);
        if (user) {
          userContext = `
PATIENT CONTEXT:
- Name: ${user.displayName}
- Cancer Type: ${user.cancerType || "Not specified"}
- Treatment Status: ${user.treatmentStatus || "Not specified"}
- Adverse Events: ${user.adverseEventHistory || "None"}
`;
        }
      }
      const suggestion = await getMealSuggestion(mealType, userContext);
      return res.json({ content: suggestion });
    } catch (error) {
      console.error("Error generating meal suggestion:", error);
      return res.status(500).json({ error: "Failed to generate suggestion" });
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

  app.get("/api/scan-results", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string, 10) || 1;
      const results = await storage.listScanResults(userId);
      return res.json(results);
    } catch (error) {
      console.error("Error fetching scan results:", error);
      return res.status(500).json({ error: "Failed to fetch scan results" });
    }
  });

  app.post("/api/scan-results", async (req, res) => {
    try {
      const result = await storage.createScanResult(req.body);
      return res.json(result);
    } catch (error) {
      console.error("Error creating scan result:", error);
      return res.status(500).json({ error: "Failed to create scan result" });
    }
  });

  app.get("/api/meals", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string, 10) || 1;
      const dateFrom = req.query.dateFrom as string | undefined;
      const dateTo = req.query.dateTo as string | undefined;
      const results = await storage.listMeals(userId, dateFrom, dateTo);
      return res.json(results);
    } catch (error) {
      console.error("Error fetching meals:", error);
      return res.status(500).json({ error: "Failed to fetch meals" });
    }
  });

  app.post("/api/meals", async (req, res) => {
    try {
      const meal = await storage.createMeal(req.body);
      return res.json(meal);
    } catch (error) {
      console.error("Error creating meal:", error);
      return res.status(500).json({ error: "Failed to create meal" });
    }
  });

  app.get("/api/mind-body", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string, 10) || 1;
      const dateFrom = req.query.dateFrom as string | undefined;
      const dateTo = req.query.dateTo as string | undefined;
      const results = await storage.listMindBodyActivities(userId, dateFrom, dateTo);
      return res.json(results);
    } catch (error) {
      console.error("Error fetching mind-body activities:", error);
      return res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  app.post("/api/mind-body", async (req, res) => {
    try {
      const activity = await storage.createMindBodyActivity(req.body);
      return res.json(activity);
    } catch (error) {
      console.error("Error creating mind-body activity:", error);
      return res.status(500).json({ error: "Failed to create activity" });
    }
  });

  app.get("/api/exercises", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string, 10) || 1;
      const dateFrom = req.query.dateFrom as string | undefined;
      const dateTo = req.query.dateTo as string | undefined;
      const results = await storage.listExercises(userId, dateFrom, dateTo);
      return res.json(results);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      return res.status(500).json({ error: "Failed to fetch exercises" });
    }
  });

  app.post("/api/exercises", async (req, res) => {
    try {
      const exercise = await storage.createExercise(req.body);
      return res.json(exercise);
    } catch (error) {
      console.error("Error creating exercise:", error);
      return res.status(500).json({ error: "Failed to create exercise" });
    }
  });

  app.get("/api/medical-records", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string, 10) || 1;
      const results = await storage.listMedicalRecords(userId);
      return res.json(results);
    } catch (error) {
      console.error("Error fetching medical records:", error);
      return res.status(500).json({ error: "Failed to fetch medical records" });
    }
  });

  app.post("/api/medical-records", async (req, res) => {
    try {
      const record = await storage.createMedicalRecord(req.body);
      return res.json(record);
    } catch (error) {
      console.error("Error creating medical record:", error);
      return res.status(500).json({ error: "Failed to create medical record" });
    }
  });

  app.post("/api/ai/date-night", async (req, res) => {
    try {
      const userId = req.body.userId || 1;
      const user = await storage.getUser(userId);
      let userContext = "";
      if (user) {
        userContext = `Patient context: ${user.cancerType || "Cancer"} patient, ${user.treatmentStatus || "in treatment"}. ${user.adverseEventHistory ? "Adverse events: " + user.adverseEventHistory : ""} Diet focus: anti-inflammatory, liver-supportive, immune-boosting foods.`;
      }
      const content = await getDateNightIdeas(userContext);
      return res.json({ content });
    } catch (error) {
      console.error("Error generating date night ideas:", error);
      return res.status(500).json({ error: "Failed to generate ideas" });
    }
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
