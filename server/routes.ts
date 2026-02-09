import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getHealthAdvice, addToKnowledgeBase, generateMealPlan, getMealSuggestion, getDateNightIdeas, getMealIdeas, searchRestaurant } from "./openai";
import authRoutes from "./routes/auth.routes";
import bcrypt from "bcrypt";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import multer from "multer";
import path from "path";
import express from "express";
import fs from "fs";
import { authenticateToken, type AuthRequest } from "./middleware/auth";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `profile-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|webp|gif)$/i;
    cb(null, allowed.test(path.extname(file.originalname)));
  },
});

const wallUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `wall-${Date.now()}-${Math.random().toString(36).slice(2, 6)}${ext}`);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|webp|gif|mp4|mov|webm|heic|heif)$/i;
    cb(null, allowed.test(path.extname(file.originalname)));
  },
});

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
    scanSummary: "Feb 2026 PET/CT: Continued improvement off therapy. Tumour 1 (Liver): 60x51mm SUV 3.2 (was 82x57 SUV 7.6). Tumour 2 (Liver): 51x42mm no focal uptake (was 67x58 SUV 9.8). Tumour 3 (Liver): 42x35mm SUV 3.1 (was 49x49 SUV 9.8). Tumour 4 (Small Bowel): Resolved — no longer visible (was 18x15mm SUV 4.2 at baseline). No new disease — brain, lungs, bones, nodes all clear.",
    nextScanDate: "2026-05-15",
    diagnosis_date: "2025-04-22",
    dietaryPreferences: "Sugar-free, dairy-free, fish or organic chicken",
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
    } else {
      const hasTumour4 = scans.some(s => s.tumourLabel === "Tumour 4 (Small Bowel)");
      if (!hasTumour4) {
        await seedTumour4(existingUser.id);
      }
    }
    await seedDefaultAppointments(existingUser.id);
    await seedTreatmentPrograms(existingUser.id);
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
    await seedDefaultAppointments(oldUser.id);
    await seedTreatmentPrograms(oldUser.id);
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
    scanSummary: "Feb 2026 PET/CT: Continued improvement off therapy. Tumour 1 (Liver): 60x51mm SUV 3.2 (was 82x57 SUV 7.6). Tumour 2 (Liver): 51x42mm no focal uptake (was 67x58 SUV 9.8). Tumour 3 (Liver): 42x35mm SUV 3.1 (was 49x49 SUV 9.8). Tumour 4 (Small Bowel): Resolved — no longer visible (was 18x15mm SUV 4.2 at baseline). No new disease — brain, lungs, bones, nodes all clear.",
    nextScanDate: "2026-05-15",
  });

  await seedScanData(user.id);
  await seedDefaultAppointments(user.id);
  await seedTreatmentPrograms(user.id);
  console.log("Seeded Liz's account with medical profile and scan data");
}

async function seedTumour4(userId: number) {
  const tumour4Data = [
    { scanDate: "2025-04-22", scanLabel: "Baseline (before treatment)", tumourLabel: "Tumour 4 (Small Bowel)", sizeX: 18, sizeY: 15, suvMax: 4.2 },
    { scanDate: "2025-08-05", scanLabel: "Post-immunotherapy (4 cycles ipi/nivo)", tumourLabel: "Tumour 4 (Small Bowel)", sizeX: 8, sizeY: 6, suvMax: 1.1 },
    { scanDate: "2026-02-03", scanLabel: "Surveillance (no treatment since Jul 2025)", tumourLabel: "Tumour 4 (Small Bowel)", sizeX: 0, sizeY: 0, suvMax: null },
  ];
  for (const t of tumour4Data) {
    await storage.createScanResult({ userId, ...t, notes: t.suvMax === null ? "Resolved — no longer visible on imaging" : null });
  }
}

async function seedScanData(userId: number) {
  const scanData = [
    { scanDate: "2025-04-22", scanLabel: "Baseline (before treatment)", tumours: [
      { label: "Tumour 1 (Liver)", sizeX: 82, sizeY: 57, suvMax: 7.6 },
      { label: "Tumour 2 (Liver)", sizeX: 67, sizeY: 58, suvMax: 9.8 },
      { label: "Tumour 3 (Liver)", sizeX: 49, sizeY: 49, suvMax: 9.8 },
      { label: "Tumour 4 (Small Bowel)", sizeX: 18, sizeY: 15, suvMax: 4.2 },
    ]},
    { scanDate: "2025-08-05", scanLabel: "Post-immunotherapy (4 cycles ipi/nivo)", tumours: [
      { label: "Tumour 1 (Liver)", sizeX: 65, sizeY: 54, suvMax: 4.3 },
      { label: "Tumour 2 (Liver)", sizeX: 60, sizeY: 49, suvMax: 3.5 },
      { label: "Tumour 3 (Liver)", sizeX: 45, sizeY: 36, suvMax: 4.3 },
      { label: "Tumour 4 (Small Bowel)", sizeX: 8, sizeY: 6, suvMax: 1.1 },
    ]},
    { scanDate: "2026-02-03", scanLabel: "Surveillance (no treatment since Jul 2025)", tumours: [
      { label: "Tumour 1 (Liver)", sizeX: 60, sizeY: 51, suvMax: 3.2 },
      { label: "Tumour 2 (Liver)", sizeX: 51, sizeY: 42, suvMax: null },
      { label: "Tumour 3 (Liver)", sizeX: 42, sizeY: 35, suvMax: 3.1 },
      { label: "Tumour 4 (Small Bowel)", sizeX: 0, sizeY: 0, suvMax: null },
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
        notes: tumour.suvMax === null && tumour.sizeX === 0 ? "Resolved — no longer visible on imaging" : null,
      });
    }
  }
}

async function seedTreatmentPrograms(userId: number) {
  const existing = await storage.listTreatmentPrograms(userId);
  if (existing.length > 0) return;

  const immunotherapy = await storage.createTreatmentProgram({
    userId,
    name: "Immunotherapy (Ipi/Nivo)",
    type: "Ipilimumab + Nivolumab",
    category: "medical",
    startDate: "2025-04-28",
    endDate: "2025-07-21",
    totalSessions: 4,
    completedSessions: 4,
    frequency: "Every 3 weeks",
    provider: "Melanoma Oncology Team",
    location: "Cancer Centre",
    notes: "Double-agent immunotherapy (ipilimumab + nivolumab). All 4 cycles completed. Treatment ceased after cycle 4 due to severe immune-related adverse events.",
    sideEffects: "Cycle 4 caused Grade 4 hepatitis (ALT ~750) and severe colitis. Required high-dose steroids and ~5 months mycophenolate immunosuppression.",
    status: "completed",
  });

  const sessions = [
    { sessionNumber: 1, date: "2025-04-28", status: "completed", notes: "Cycle 1 - tolerated well", sideEffects: null },
    { sessionNumber: 2, date: "2025-05-19", status: "completed", notes: "Cycle 2 - mild fatigue", sideEffects: "Mild fatigue" },
    { sessionNumber: 3, date: "2025-06-09", status: "completed", notes: "Cycle 3 - good tolerance", sideEffects: "Mild fatigue, slight nausea" },
    { sessionNumber: 4, date: "2025-07-01", status: "completed", notes: "Cycle 4 - severe adverse events developed post-infusion", sideEffects: "Grade 4 hepatitis (ALT ~750), severe colitis. Required hospitalisation, high-dose steroids, and 5 months mycophenolate." },
  ];

  for (const s of sessions) {
    await storage.createTreatmentSession({
      programId: immunotherapy.id,
      userId,
      sessionNumber: s.sessionNumber,
      date: s.date,
      time: "9:00 AM",
      status: s.status,
      notes: s.notes,
      sideEffects: s.sideEffects,
    });
  }

  const hbot = await storage.createTreatmentProgram({
    userId,
    name: "Hyperbaric Oxygen Therapy",
    type: "HBOT",
    category: "complementary",
    startDate: "2025-05-15",
    endDate: null,
    totalSessions: null,
    completedSessions: 100,
    frequency: "5 days per week",
    provider: "Integrative Health Centre",
    location: "Hyperbaric Centre, Sydney",
    notes: "100 sessions completed since diagnosis. Supporting immune recovery, tissue healing, and oxygen saturation. Ongoing maintenance.",
    status: "active",
  });

  const hbotStartDate = new Date("2025-05-15");
  for (let i = 1; i <= 100; i++) {
    const sessionDate = new Date(hbotStartDate);
    const weeksOffset = Math.floor((i - 1) / 5);
    const dayInWeek = (i - 1) % 5;
    sessionDate.setDate(hbotStartDate.getDate() + weeksOffset * 7 + dayInWeek);
    await storage.createTreatmentSession({
      programId: hbot.id,
      userId,
      sessionNumber: i,
      date: sessionDate.toISOString().split("T")[0],
      time: "7:00 AM",
      status: "completed",
      notes: i === 1 ? "First session" : i === 50 ? "Halfway milestone!" : i === 100 ? "100 sessions - incredible commitment!" : null,
      sideEffects: null,
    });
  }

  await storage.createTreatmentProgram({
    userId,
    name: "Acupuncture",
    type: "Traditional Chinese Medicine",
    category: "complementary",
    startDate: "2025-12-01",
    endDate: null,
    totalSessions: null,
    completedSessions: 10,
    frequency: "Weekly",
    provider: "Dr. Sarah Chen",
    location: "Integrative Wellness Clinic",
    notes: "Supporting immune system recovery, managing fatigue, and promoting overall wellbeing.",
    status: "active",
  });

  await storage.createTreatmentProgram({
    userId,
    name: "Yoga for Cancer Recovery",
    type: "Gentle Yoga",
    category: "mind-body",
    startDate: "2026-01-06",
    endDate: null,
    totalSessions: null,
    completedSessions: 12,
    frequency: "Twice weekly",
    provider: "Cancer Support Centre",
    location: "Community Wellness Hub",
    notes: "Gentle restorative yoga specifically designed for cancer patients. Focus on breathing, gentle stretching, and meditation.",
    status: "active",
  });

  await storage.createTreatmentProgram({
    userId,
    name: "Integrative Oncologist Reviews",
    type: "Consultations",
    category: "integrative",
    startDate: "2025-11-01",
    endDate: null,
    totalSessions: null,
    completedSessions: 3,
    frequency: "Monthly",
    provider: "Dr. James Mitchell",
    location: "Integrative Oncology Clinic",
    notes: "Monthly reviews covering supplement protocols, nutrition guidance, and holistic treatment planning alongside conventional care.",
    status: "active",
  });

  await storage.createTreatmentProgram({
    userId,
    name: "Psychology Support",
    type: "Psycho-oncology",
    category: "mind-body",
    startDate: "2025-09-01",
    endDate: null,
    totalSessions: null,
    completedSessions: 8,
    frequency: "Fortnightly",
    provider: "Dr. Emma Walsh",
    location: "Cancer Psychology Centre",
    notes: "Psycho-oncology support for processing diagnosis, managing scanxiety, and building resilience.",
    status: "active",
  });
}

async function seedDefaultAppointments(userId: number) {
  const existing = await storage.listAppointments(userId);
  if (existing.length > 0) return;
  
  const defaultAppointments = [
    { userId, title: "PET/CT Scan", description: "Follow-up PET/CT scan to assess treatment response", date: "2026-05-15", time: "9:00 AM", location: "Radiology Department" },
    { userId, title: "Oncology Review", description: "Review scan results and discuss next steps", date: "2026-05-22", time: "10:30 AM", location: "Oncology Clinic" },
    { userId, title: "Nutrition Consultation", description: "Liver-supportive and immune-boosting nutrition planning", date: "2026-03-10", time: "2:00 PM", location: "Integrative Health Centre" },
  ];
  
  for (const appt of defaultAppointments) {
    await storage.createAppointment(appt);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use('/api/auth', authRoutes);
  app.use('/uploads', express.static(uploadDir));

  await seedLizAccount();

  app.post("/api/users/:id/photo", authenticateToken, upload.single("photo"), async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid user ID" });
      if (req.user?.id !== id) return res.status(403).json({ error: "Not authorized" });
      if (!req.file) return res.status(400).json({ error: "No photo uploaded" });
      const photoUrl = `/uploads/${req.file.filename}`;
      const updated = await storage.updateUser(id, { profilePhoto: photoUrl });
      if (!updated) return res.status(404).json({ error: "User not found" });
      return res.json(updated);
    } catch (error) {
      console.error("Error uploading photo:", error);
      return res.status(500).json({ error: "Failed to upload photo" });
    }
  });

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
- Dietary Preferences: ${user.dietaryPreferences || "Not specified"}
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

  app.post("/api/ai/meal-ideas", async (req, res) => {
    try {
      const userId = req.body.userId || 1;
      const excludeNames = req.body.excludeNames || "";
      const mealTypes = req.body.mealTypes || "all";
      const user = await storage.getUser(userId);
      let userContext = "";
      let dietaryPreferences = "";
      if (user) {
        userContext = `Patient context: ${user.cancerType || "Cancer"} patient, ${user.treatmentStatus || "in treatment"}. ${user.adverseEventHistory ? "Adverse events: " + user.adverseEventHistory : ""} Focus: anti-inflammatory, liver-supportive, immune-boosting nutrition.`;
        dietaryPreferences = user.dietaryPreferences || "sugar-free, dairy-free, fish or organic chicken";
      }
      const suggestions = await getMealIdeas(userContext, dietaryPreferences, excludeNames, mealTypes);
      return res.json(suggestions);
    } catch (error: any) {
      console.error("Error generating meal ideas:", error);
      const message = error?.message || "Failed to generate meal ideas";
      const status = message.includes("temporarily busy") ? 503 : 500;
      return res.status(status).json({ error: message });
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

  // Scan results
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

  app.patch("/api/scan-results/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      const result = await storage.updateScanResult(id, req.body);
      return res.json(result);
    } catch (error) {
      console.error("Error updating scan result:", error);
      return res.status(500).json({ error: "Failed to update scan result" });
    }
  });

  app.delete("/api/scan-results/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      await storage.deleteScanResult(id);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting scan result:", error);
      return res.status(500).json({ error: "Failed to delete scan result" });
    }
  });

  // Meals
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

  app.patch("/api/meals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      const meal = await storage.updateMeal(id, req.body);
      return res.json(meal);
    } catch (error) {
      console.error("Error updating meal:", error);
      return res.status(500).json({ error: "Failed to update meal" });
    }
  });

  app.delete("/api/meals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      await storage.deleteMeal(id);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting meal:", error);
      return res.status(500).json({ error: "Failed to delete meal" });
    }
  });

  // Mind-body activities
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

  app.patch("/api/mind-body/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      const activity = await storage.updateMindBodyActivity(id, req.body);
      return res.json(activity);
    } catch (error) {
      console.error("Error updating mind-body activity:", error);
      return res.status(500).json({ error: "Failed to update activity" });
    }
  });

  app.delete("/api/mind-body/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      await storage.deleteMindBodyActivity(id);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting mind-body activity:", error);
      return res.status(500).json({ error: "Failed to delete activity" });
    }
  });

  // Exercises
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

  app.patch("/api/exercises/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      const exercise = await storage.updateExercise(id, req.body);
      return res.json(exercise);
    } catch (error) {
      console.error("Error updating exercise:", error);
      return res.status(500).json({ error: "Failed to update exercise" });
    }
  });

  app.delete("/api/exercises/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      await storage.deleteExercise(id);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting exercise:", error);
      return res.status(500).json({ error: "Failed to delete exercise" });
    }
  });

  // Medical records
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

  // Date nights
  app.post("/api/ai/date-night", async (req, res) => {
    try {
      const userId = req.body.userId || 1;
      const excludeNames = req.body.excludeNames || "";
      const type = req.body.type || "both";
      const user = await storage.getUser(userId);
      let userContext = "";
      let dietaryPreferences = "";
      if (user) {
        userContext = `Patient context: ${user.cancerType || "Cancer"} patient, ${user.treatmentStatus || "in treatment"}. ${user.adverseEventHistory ? "Adverse events: " + user.adverseEventHistory : ""} Diet focus: anti-inflammatory, liver-supportive, immune-boosting foods.`;
        dietaryPreferences = user.dietaryPreferences || "";
      }
      const suggestions = await getDateNightIdeas(userContext, dietaryPreferences, excludeNames, type);
      return res.json(suggestions);
    } catch (error: any) {
      console.error("Error generating date night ideas:", error);
      if (error?.message?.includes("temporarily busy")) {
        return res.status(503).json({ error: error.message });
      }
      return res.status(500).json({ error: "Failed to generate ideas" });
    }
  });

  app.post("/api/ai/restaurant-search", async (req, res) => {
    try {
      const { query, userId } = req.body;
      if (!query || typeof query !== "string" || query.trim().length < 2) {
        return res.status(400).json({ error: "Please enter a restaurant name or search term." });
      }
      const user = userId ? await storage.getUser(userId) : null;
      let userContext = "";
      let dietaryPreferences = "";
      if (user) {
        userContext = `Patient context: ${user.cancerType || "Cancer"} patient, ${user.treatmentStatus || "in treatment"}. ${user.adverseEventHistory ? "Adverse events: " + user.adverseEventHistory : ""} Diet focus: anti-inflammatory, liver-supportive, immune-boosting foods.`;
        dietaryPreferences = user.dietaryPreferences || "";
      }
      const results = await searchRestaurant(query.trim(), dietaryPreferences, userContext);
      return res.json({ restaurants: results });
    } catch (error: any) {
      console.error("Error searching restaurants:", error);
      if (error?.message?.includes("temporarily busy")) {
        return res.status(503).json({ error: error.message });
      }
      return res.status(500).json({ error: "Failed to search restaurants" });
    }
  });

  app.get("/api/date-nights", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string, 10) || 1;
      const results = await storage.listDateNights(userId);
      return res.json(results);
    } catch (error) {
      console.error("Error fetching date nights:", error);
      return res.status(500).json({ error: "Failed to fetch date nights" });
    }
  });

  app.post("/api/date-nights", async (req, res) => {
    try {
      const dateNight = await storage.createDateNight(req.body);
      return res.json(dateNight);
    } catch (error) {
      console.error("Error creating date night:", error);
      return res.status(500).json({ error: "Failed to save date night" });
    }
  });

  app.patch("/api/date-nights/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      const existing = await storage.getDateNight(id);
      if (!existing) return res.status(404).json({ error: "Date night not found" });
      const updated = await storage.updateDateNight(id, req.body);
      return res.json(updated);
    } catch (error) {
      console.error("Error updating date night:", error);
      return res.status(500).json({ error: "Failed to update date night" });
    }
  });

  // Appointments (DB-backed)
  app.get("/api/appointments", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string, 10) || 1;
      const results = await storage.listAppointments(userId);
      return res.json(results);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      return res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      const appt = await storage.createAppointment(req.body);
      return res.json(appt);
    } catch (error) {
      console.error("Error creating appointment:", error);
      return res.status(500).json({ error: "Failed to create appointment" });
    }
  });

  app.patch("/api/appointments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      const appt = await storage.updateAppointment(id, req.body);
      return res.json(appt);
    } catch (error) {
      console.error("Error updating appointment:", error);
      return res.status(500).json({ error: "Failed to update appointment" });
    }
  });

  app.delete("/api/appointments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      await storage.deleteAppointment(id);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting appointment:", error);
      return res.status(500).json({ error: "Failed to delete appointment" });
    }
  });

  // Custom activity types
  app.get("/api/activity-types", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string, 10) || 1;
      const category = req.query.category as string | undefined;
      const results = await storage.listCustomActivityTypes(userId, category);
      return res.json(results);
    } catch (error) {
      console.error("Error fetching activity types:", error);
      return res.status(500).json({ error: "Failed to fetch activity types" });
    }
  });

  app.post("/api/activity-types", async (req, res) => {
    try {
      const type = await storage.createCustomActivityType(req.body);
      return res.json(type);
    } catch (error) {
      console.error("Error creating activity type:", error);
      return res.status(500).json({ error: "Failed to create activity type" });
    }
  });

  app.patch("/api/activity-types/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      const type = await storage.updateCustomActivityType(id, req.body);
      return res.json(type);
    } catch (error) {
      console.error("Error updating activity type:", error);
      return res.status(500).json({ error: "Failed to update activity type" });
    }
  });

  app.delete("/api/activity-types/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      await storage.deleteCustomActivityType(id);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting activity type:", error);
      return res.status(500).json({ error: "Failed to delete activity type" });
    }
  });

  // Treatment Programs
  app.get("/api/treatment-programs", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string, 10) || 1;
      const programs = await storage.listTreatmentPrograms(userId);
      return res.json(programs);
    } catch (error) {
      console.error("Error fetching treatment programs:", error);
      return res.status(500).json({ error: "Failed to fetch treatment programs" });
    }
  });

  app.post("/api/treatment-programs", async (req, res) => {
    try {
      const program = await storage.createTreatmentProgram(req.body);
      return res.json(program);
    } catch (error) {
      console.error("Error creating treatment program:", error);
      return res.status(500).json({ error: "Failed to create treatment program" });
    }
  });

  app.patch("/api/treatment-programs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      const program = await storage.updateTreatmentProgram(id, req.body);
      return res.json(program);
    } catch (error) {
      console.error("Error updating treatment program:", error);
      return res.status(500).json({ error: "Failed to update treatment program" });
    }
  });

  app.delete("/api/treatment-programs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      await storage.deleteTreatmentProgram(id);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting treatment program:", error);
      return res.status(500).json({ error: "Failed to delete treatment program" });
    }
  });

  // Treatment Sessions
  app.get("/api/treatment-sessions", async (req, res) => {
    try {
      const programId = req.query.programId ? parseInt(req.query.programId as string, 10) : null;
      const userId = parseInt(req.query.userId as string, 10) || 1;
      if (programId) {
        const sessions = await storage.listTreatmentSessions(programId);
        return res.json(sessions);
      }
      const sessions = await storage.listAllTreatmentSessions(userId);
      return res.json(sessions);
    } catch (error) {
      console.error("Error fetching treatment sessions:", error);
      return res.status(500).json({ error: "Failed to fetch treatment sessions" });
    }
  });

  app.post("/api/treatment-sessions", async (req, res) => {
    try {
      const session = await storage.createTreatmentSession(req.body);
      return res.json(session);
    } catch (error) {
      console.error("Error creating treatment session:", error);
      return res.status(500).json({ error: "Failed to create treatment session" });
    }
  });

  app.patch("/api/treatment-sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      const session = await storage.updateTreatmentSession(id, req.body);
      return res.json(session);
    } catch (error) {
      console.error("Error updating treatment session:", error);
      return res.status(500).json({ error: "Failed to update treatment session" });
    }
  });

  app.delete("/api/treatment-sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      await storage.deleteTreatmentSession(id);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting treatment session:", error);
      return res.status(500).json({ error: "Failed to delete treatment session" });
    }
  });

  // ICS Calendar Download
  app.get("/api/appointments/:id/ics", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      const appointments_list = await storage.listAppointments(1);
      const appt = appointments_list.find(a => a.id === id);
      if (!appt) return res.status(404).json({ error: "Appointment not found" });

      const startDate = appt.date.replace(/-/g, '');
      const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Elizabeth//Cancer Support//EN',
        'BEGIN:VEVENT',
        `DTSTART;VALUE=DATE:${startDate}`,
        `SUMMARY:${appt.title}`,
        appt.description ? `DESCRIPTION:${appt.description.replace(/\n/g, '\\n')}` : '',
        appt.location ? `LOCATION:${appt.location}` : '',
        `UID:elizabeth-appt-${appt.id}@elizabeth.app`,
        'END:VEVENT',
        'END:VCALENDAR',
      ].filter(Boolean).join('\r\n');

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${appt.title.replace(/\s+/g, '_')}.ics"`);
      return res.send(ics);
    } catch (error) {
      console.error("Error generating ICS:", error);
      return res.status(500).json({ error: "Failed to generate calendar file" });
    }
  });

  // Daily Brief (AI-generated)
  app.post("/api/ai/daily-brief", async (req, res) => {
    try {
      const userId = req.body.userId || 1;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const appointments_list = await storage.listAppointments(userId);
      const today = new Date().toISOString().split("T")[0];
      const upcoming = appointments_list
        .filter(a => a.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5);

      const programs = await storage.listTreatmentPrograms(userId);
      const activePrograms = programs.filter(p => p.status === "active");

      const scanData = await storage.listScanResults(userId);

      const userContext = `
PATIENT: ${user.displayName}
DIAGNOSIS: ${user.cancerType || "Not specified"}, ${user.cancerStage || "Not specified"}
STATUS: ${user.treatmentStatus || "Not specified"}
TREATMENT HISTORY: ${user.treatmentHistory || "None"}
GOALS: ${user.goals || "Not specified"}
NEXT SCAN: ${user.nextScanDate || "Not scheduled"}
DIETARY PREFERENCES: ${user.dietaryPreferences || "Not specified"}
SCAN SUMMARY: ${user.scanSummary || "No scan data"}
ACTIVE PROGRAMS: ${activePrograms.map(p => `${p.name} (${p.completedSessions}/${p.totalSessions} sessions)`).join(", ") || "None"}
UPCOMING APPOINTMENTS: ${upcoming.map(a => `${a.title} on ${a.date}`).join(", ") || "None upcoming"}
TODAY'S DATE: ${new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Australia/Sydney' })}
`;

      const { getHealthAdvice } = await import("./openai");
      const briefPrompt = `Write a SHORT morning one-liner (under 12 words) for this cancer patient. Like a punchy text message from a best mate.

Examples of the RIGHT length:
- "Your tumours are basically running scared at this point"
- "56 sessions deep — absolute weapon 💪"
- "Hey, you're allowed to just vibe today"
- "2 down, 2 to go — John Wick energy"
- "Your immune system called, it says you're welcome"

HARD RULES:
- MAX 12 words. Shorter is better. Never a paragraph.
- One sentence only. No second sentence. No explanation.
- Sometimes funny, sometimes warm, sometimes badass
- Reference their real data when it fits naturally
- Max 1 emoji or none. Australian English.
- Output ONLY the line, nothing else`;

      let brief = await getHealthAdvice(briefPrompt, userContext);
      brief = brief.replace(/^["']|["']$/g, "").split(/\.\s|\n/)[0].trim();
      if (brief.length > 120) brief = brief.substring(0, 117) + "...";
      return res.json({ content: brief, generatedAt: new Date().toISOString() });
    } catch (error) {
      console.error("Error generating daily brief:", error);
      return res.status(500).json({ error: "Failed to generate daily brief" });
    }
  });

  // AI Treatment Suggestions
  app.post("/api/ai/treatment-suggestions", async (req, res) => {
    try {
      const userId = req.body.userId || 1;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const programs = await storage.listTreatmentPrograms(userId);

      const { getHealthAdvice } = await import("./openai");
      const prompt = `Based on this patient's profile, suggest 4-6 complementary therapy programs they could consider adding to their healing journey. For each suggestion, provide:
- name: therapy name
- type: category (e.g., "physical", "mind-body", "nutrition", "integrative")
- description: brief 1-2 sentence description of benefits specifically for their condition
- frequency: suggested frequency (e.g., "weekly", "twice weekly")
- evidence: brief note on evidence base for cancer patients

Current programs: ${programs.map(p => p.name).join(", ") || "None"}

Return ONLY valid JSON array, no markdown. Example: [{"name":"...", "type":"...", "description":"...", "frequency":"...", "evidence":"..."}]`;

      const userContext = `Patient: ${user.cancerType}, ${user.cancerStage}. Status: ${user.treatmentStatus}. History: ${user.treatmentHistory}. Adverse events: ${user.adverseEventHistory}`;
      const response = await getHealthAdvice(prompt, userContext);

      try {
        const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const suggestions = JSON.parse(cleaned);
        return res.json({ suggestions });
      } catch {
        return res.json({ suggestions: [], raw: response });
      }
    } catch (error) {
      console.error("Error generating treatment suggestions:", error);
      return res.status(500).json({ error: "Failed to generate suggestions" });
    }
  });

  // Journal Entries (Gut Check)
  app.get("/api/journal", async (req, res) => {
    const userId = parseInt(req.query.userId as string) || 1;
    const dateFrom = req.query.dateFrom as string | undefined;
    const dateTo = req.query.dateTo as string | undefined;
    const entries = await storage.listJournalEntries(userId, dateFrom, dateTo);
    return res.json(entries);
  });

  app.post("/api/journal", async (req, res) => {
    try {
      const entry = await storage.createJournalEntry(req.body);
      return res.json(entry);
    } catch (error) {
      return res.status(500).json({ error: "Failed to create journal entry" });
    }
  });

  app.patch("/api/journal/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const entry = await storage.updateJournalEntry(id, req.body);
      return res.json(entry);
    } catch (error) {
      return res.status(500).json({ error: "Failed to update journal entry" });
    }
  });

  app.delete("/api/journal/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteJournalEntry(id);
    return res.json({ success: true });
  });

  // AI Journal Analysis
  app.post("/api/ai/journal-analysis", async (req, res) => {
    try {
      const userId = req.body.userId || 1;
      const entries = await storage.listJournalEntries(userId);
      if (entries.length < 2) {
        return res.json({ analysis: "Keep journaling! After a few more entries, I'll spot patterns and share insights." });
      }
      const { getHealthAdvice } = await import("./openai");
      const entriesText = entries
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-14)
        .map(e => `${e.date} | Mood: ${e.mood || '?'}/5 | Energy: ${e.energy || '?'}/5 | "${e.content}"`)
        .join("\n");
      const prompt = `Analyse these recent gut-check journal entries from a cancer patient. Look for:
1. Mood/energy patterns (improving, declining, fluctuating?)
2. Common themes or triggers
3. One specific, actionable recommendation

Entries:
${entriesText}

Keep analysis warm, supportive, 2-3 sentences max. Reference specific patterns you notice. Use Australian English.`;
      const analysis = await getHealthAdvice(prompt, "");
      return res.json({ analysis });
    } catch (error) {
      console.error("Error analysing journal:", error);
      return res.status(500).json({ error: "Failed to analyse journal" });
    }
  });

  // Tumour Nicknames
  app.get("/api/tumour-nicknames", async (req, res) => {
    const userId = parseInt(req.query.userId as string) || 1;
    const nicknames = await storage.listTumourNicknames(userId);
    return res.json(nicknames);
  });

  app.post("/api/tumour-nicknames", async (req, res) => {
    try {
      const nickname = await storage.upsertTumourNickname(req.body);
      return res.json(nickname);
    } catch (error) {
      return res.status(500).json({ error: "Failed to save nickname" });
    }
  });

  // Motivational Wall
  app.get("/api/motivational-wall", async (req, res) => {
    const userId = parseInt(req.query.userId as string) || 1;
    const items = await storage.listMotivationalWallItems(userId);
    return res.json(items);
  });

  app.post("/api/motivational-wall", async (req, res) => {
    try {
      const item = await storage.createMotivationalWallItem(req.body);
      return res.json(item);
    } catch (error) {
      return res.status(500).json({ error: "Failed to add wall item" });
    }
  });

  app.post("/api/motivational-wall/upload", wallUpload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      const fileUrl = `/uploads/${req.file.filename}`;
      const isVideo = /\.(mp4|mov|webm)$/i.test(req.file.originalname);
      const type = isVideo ? "video" : "image";
      const userId = parseInt(req.body.userId) || 1;
      const content = req.body.content || "";
      const color = req.body.color || "amber";
      const item = await storage.createMotivationalWallItem({
        userId,
        type,
        content,
        imageUrl: fileUrl,
        color,
      });
      return res.json(item);
    } catch (error) {
      console.error("Error uploading wall media:", error);
      return res.status(500).json({ error: "Failed to upload media" });
    }
  });

  app.patch("/api/motivational-wall/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.updateMotivationalWallItem(id, req.body);
      return res.json(item);
    } catch (error) {
      return res.status(500).json({ error: "Failed to update wall item" });
    }
  });

  app.delete("/api/motivational-wall/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteMotivationalWallItem(id);
    return res.json({ success: true });
  });

  // Bulk session import (for backdating)
  app.post("/api/treatment-sessions/bulk", async (req, res) => {
    try {
      const { programId, userId, sessions } = req.body;
      if (!Array.isArray(sessions)) return res.status(400).json({ error: "sessions must be an array" });
      const created = [];
      for (const s of sessions) {
        const session = await storage.createTreatmentSession({
          programId,
          userId,
          sessionNumber: s.sessionNumber,
          date: s.date,
          time: s.time || null,
          status: s.status || "completed",
          notes: s.notes || null,
          sideEffects: s.sideEffects || null,
        });
        created.push(session);
      }
      if (req.body.updateCompletedCount) {
        const program = await storage.getTreatmentProgram(programId);
        if (program) {
          const allSessions = await storage.listTreatmentSessions(programId);
          const completedCount = allSessions.filter(s => s.status === "completed").length;
          await storage.updateTreatmentProgram(programId, { completedSessions: completedCount });
        }
      }
      return res.json({ created: created.length, sessions: created });
    } catch (error) {
      console.error("Error bulk creating sessions:", error);
      return res.status(500).json({ error: "Failed to bulk create sessions" });
    }
  });

  // Fun Facts / Rotating Stats
  app.get("/api/fun-facts", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string) || 1;
      const meals = await storage.listMeals(userId);
      const exercises = await storage.listExercises(userId);
      const mindBody = await storage.listMindBodyActivities(userId);
      const programs = await storage.listTreatmentPrograms(userId);
      const allSessions = await storage.listAllTreatmentSessions(userId);

      const totalMeals = meals.length;
      const greenItems = meals.filter(m => m.description.toLowerCase().match(/green|salad|spinach|kale|broccoli|juice|smoothie/)).length;
      const totalExerciseMin = exercises.reduce((sum, e) => sum + (e.durationMinutes || 0), 0);
      const totalMindBodyMin = mindBody.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);
      const hbotSessions = allSessions.filter(s => {
        const prog = programs.find(p => p.id === s.programId);
        return prog && prog.name.toLowerCase().includes("hyperbaric");
      }).length;
      const totalWellnessActivities = meals.length + exercises.length + mindBody.length;
      const sugarFreeMeals = meals.filter(m => !m.description.toLowerCase().match(/sugar|cake|chocolate|candy|cookie|ice cream/)).length;
      const meditationSessions = mindBody.filter(a => a.activityType.toLowerCase().match(/meditation|meditat|mindful/)).length;
      const yogaSessions = exercises.filter(e => e.exerciseType.toLowerCase().includes("yoga")).length + mindBody.filter(a => a.activityType.toLowerCase().includes("yoga")).length;

      const facts = [
        totalMeals > 0 ? `${totalMeals} nourishing meals logged — your body thanks you! 🥗` : null,
        greenItems > 0 ? `${greenItems} green meals this year — hello, plant power! 🌿` : null,
        hbotSessions > 0 ? `${hbotSessions} hyperbaric sessions — ${Math.round(hbotSessions * 1.5)} hours of pure oxygen therapy! 💨` : null,
        totalExerciseMin > 0 ? `${totalExerciseMin} minutes of movement — that's ${Math.round(totalExerciseMin / 60)} hours of healing in motion! 🏃‍♀️` : null,
        totalMindBodyMin > 0 ? `${totalMindBodyMin} minutes of mindfulness — your inner peace game is strong! 🧘` : null,
        sugarFreeMeals > 5 ? `~${Math.round(sugarFreeMeals * 0.15)}kg of sugar you didn't consume! Your cells are cheering 🎉` : null,
        totalWellnessActivities > 0 ? `${totalWellnessActivities} wellness activities logged — that's dedication! ⭐` : null,
        meditationSessions > 0 ? `${meditationSessions} meditation sessions — zen master in the making! 🧘‍♀️` : null,
        yogaSessions > 0 ? `${yogaSessions} yoga sessions — flexibility queen! 🧘` : null,
        hbotSessions >= 100 ? `100 hyperbaric sessions! That's over 150 hours in the chamber. Legend! 🏆` : null,
        `${new Date().getFullYear() - 2025 > 0 ? Math.round((Date.now() - new Date("2025-04-28").getTime()) / 86400000) : Math.round((Date.now() - new Date("2025-04-28").getTime()) / 86400000)} days of fighting — and counting! 💪`,
      ].filter(Boolean);

      return res.json({ facts });
    } catch (error) {
      console.error("Error generating fun facts:", error);
      return res.status(500).json({ error: "Failed to generate fun facts" });
    }
  });

  // Community Threads
  app.get("/api/community/threads", async (req, res) => {
    try {
      const threads = await storage.listCommunityThreads();
      return res.json(threads);
    } catch (error) {
      console.error("Error fetching threads:", error);
      return res.status(500).json({ error: "Failed to fetch threads" });
    }
  });

  app.get("/api/community/threads/:id", async (req, res) => {
    try {
      const thread = await storage.getCommunityThread(parseInt(req.params.id));
      if (!thread) return res.status(404).json({ error: "Thread not found" });
      return res.json(thread);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch thread" });
    }
  });

  app.post("/api/community/threads", async (req, res) => {
    try {
      const thread = await storage.createCommunityThread(req.body);
      return res.json(thread);
    } catch (error) {
      console.error("Error creating thread:", error);
      return res.status(500).json({ error: "Failed to create thread" });
    }
  });

  app.patch("/api/community/threads/:id", async (req, res) => {
    try {
      const thread = await storage.updateCommunityThread(parseInt(req.params.id), req.body);
      return res.json(thread);
    } catch (error) {
      return res.status(500).json({ error: "Failed to update thread" });
    }
  });

  app.delete("/api/community/threads/:id", async (req, res) => {
    try {
      await storage.deleteCommunityThread(parseInt(req.params.id));
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: "Failed to delete thread" });
    }
  });

  // Community Replies
  app.get("/api/community/threads/:id/replies", async (req, res) => {
    try {
      const replies = await storage.listCommunityReplies(parseInt(req.params.id));
      return res.json(replies);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch replies" });
    }
  });

  app.post("/api/community/threads/:id/replies", async (req, res) => {
    try {
      const reply = await storage.createCommunityReply({
        ...req.body,
        threadId: parseInt(req.params.id),
      });
      return res.json(reply);
    } catch (error) {
      return res.status(500).json({ error: "Failed to create reply" });
    }
  });

  app.delete("/api/community/replies/:id", async (req, res) => {
    try {
      await storage.deleteCommunityReply(parseInt(req.params.id));
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: "Failed to delete reply" });
    }
  });

  // Medical Documents
  app.get("/api/medical-documents", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string) || 1;
      const docs = await storage.listMedicalDocuments(userId);
      return res.json(docs);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.post("/api/medical-documents", async (req, res) => {
    try {
      const doc = await storage.createMedicalDocument(req.body);
      return res.json(doc);
    } catch (error) {
      return res.status(500).json({ error: "Failed to create document" });
    }
  });

  app.patch("/api/medical-documents/:id", async (req, res) => {
    try {
      const doc = await storage.updateMedicalDocument(parseInt(req.params.id), req.body);
      return res.json(doc);
    } catch (error) {
      return res.status(500).json({ error: "Failed to update document" });
    }
  });

  app.delete("/api/medical-documents/:id", async (req, res) => {
    try {
      await storage.deleteMedicalDocument(parseInt(req.params.id));
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // AI Medical Summary
  app.post("/api/ai/medical-summary", async (req, res) => {
    try {
      const userId = req.body.userId || 1;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const scanData = await storage.listScanResults(userId);
      const programs = await storage.listTreatmentPrograms(userId);
      const documents = await storage.listMedicalDocuments(userId);

      const tumourGroups: Record<string, any[]> = {};
      scanData.forEach(r => {
        if (!tumourGroups[r.tumourLabel]) tumourGroups[r.tumourLabel] = [];
        tumourGroups[r.tumourLabel].push(r);
      });

      const tumourSummaries = Object.entries(tumourGroups).map(([label, scans]) => {
        const sorted = [...scans].sort((a: any, b: any) => new Date(a.scanDate).getTime() - new Date(b.scanDate).getTime());
        const baseline = sorted[0];
        const latest = sorted[sorted.length - 1];
        const baseArea = baseline.sizeX * baseline.sizeY;
        const latArea = latest.sizeX * latest.sizeY;
        const isResolved = latArea === 0;
        const reduction = baseArea > 0 ? ((baseArea - latArea) / baseArea * 100).toFixed(0) : "0";
        return `${label}: ${isResolved ? "RESOLVED (gone)" : `${reduction}% smaller, SUV ${latest.suvMax ?? "no uptake"}`}`;
      });

      const userContext = `
PATIENT: ${user.displayName}
DIAGNOSIS: ${user.cancerType || "Not specified"}, ${user.cancerStage || "Not specified"}
STATUS: ${user.treatmentStatus || "Active surveillance"}
TREATMENT HISTORY: ${user.treatmentHistory || "None"}
ADVERSE EVENTS: ${user.adverseEventHistory || "None"}
SCAN SUMMARY: ${user.scanSummary || "No data"}
NEXT SCAN: ${user.nextScanDate || "Not scheduled"}
TUMOUR STATUS: ${tumourSummaries.join("; ")}
ACTIVE PROGRAMS: ${programs.filter(p => p.status === "active").map(p => p.name).join(", ") || "None"}
DOCUMENTS ON FILE: ${documents.length} documents
`;

      const { getHealthAdvice } = await import("./openai");
      const prompt = `Write a brief, easy-to-read medical situation summary for this cancer patient. This is for the patient herself (not a doctor). Be warm but factual. Structure as:

1. **Where you're at** - 2-3 sentences about current status
2. **What's working** - 1-2 sentences about positive progress  
3. **What to watch** - 1-2 sentences about upcoming milestones or things to monitor

Keep it concise (max 150 words total). Use plain language. Be encouraging but honest. Australian English. No medical jargon.`;

      const summary = await getHealthAdvice(prompt, userContext);
      return res.json({ summary, generatedAt: new Date().toISOString() });
    } catch (error) {
      console.error("Error generating medical summary:", error);
      return res.status(500).json({ error: "Failed to generate summary" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
