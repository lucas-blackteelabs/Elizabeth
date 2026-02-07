import { pgTable, text, serial, integer, boolean, date, jsonb, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull().unique(),
  cancerType: text("cancer_type"),
  cancerStage: text("cancer_stage"),
  bio: text("bio"),
  diagnosis_date: date("diagnosis_date"),
  treatmentStatus: text("treatment_status"),
  treatmentHistory: text("treatment_history"),
  currentMedications: text("current_medications"),
  adverseEventHistory: text("adverse_event_history"),
  oncologist: text("oncologist"),
  goals: text("goals"),
  medicalNotes: text("medical_notes"),
  scanSummary: text("scan_summary"),
  nextScanDate: date("next_scan_date"),
  dietaryPreferences: text("dietary_preferences"),
  profilePhoto: text("profile_photo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  email: true,
  cancerType: true,
  cancerStage: true,
  bio: true,
  diagnosis_date: true,
  treatmentStatus: true,
  treatmentHistory: true,
  currentMedications: true,
  adverseEventHistory: true,
  oncologist: true,
  goals: true,
  medicalNotes: true,
  scanSummary: true,
  nextScanDate: true,
  dietaryPreferences: true,
  profilePhoto: true,
});

export const updateUserSchema = createInsertSchema(users).omit({
  id: true,
  username: true,
  password: true,
  createdAt: true,
}).partial();

export const scanResults = pgTable("scan_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  scanDate: date("scan_date").notNull(),
  scanLabel: text("scan_label").notNull(),
  tumourLabel: text("tumour_label").notNull(),
  sizeX: real("size_x").notNull(),
  sizeY: real("size_y").notNull(),
  suvMax: real("suv_max"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertScanResultSchema = createInsertSchema(scanResults).pick({
  userId: true,
  scanDate: true,
  scanLabel: true,
  tumourLabel: true,
  sizeX: true,
  sizeY: true,
  suvMax: true,
  notes: true,
});

export const medicalRecords = pgTable("medical_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: date("date").notNull(),
  recordType: text("record_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  data: jsonb("data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMedicalRecordSchema = createInsertSchema(medicalRecords).pick({
  userId: true,
  date: true,
  recordType: true,
  title: true,
  description: true,
  data: true,
});

export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: date("date").notNull(),
  mealType: text("meal_type").notNull(),
  description: text("description").notNull(),
  antiInflammatoryScore: integer("anti_inflammatory_score"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMealSchema = createInsertSchema(meals).pick({
  userId: true,
  date: true,
  mealType: true,
  description: true,
  antiInflammatoryScore: true,
});

export const mindBodyActivities = pgTable("mind_body_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: date("date").notNull(),
  activityType: text("activity_type").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMindBodyActivitySchema = createInsertSchema(mindBodyActivities).pick({
  userId: true,
  date: true,
  activityType: true,
  durationMinutes: true,
  notes: true,
});

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: date("date").notNull(),
  exerciseType: text("exercise_type").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  intensity: text("intensity").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertExerciseSchema = createInsertSchema(exercises).pick({
  userId: true,
  date: true,
  exerciseType: true,
  durationMinutes: true,
  intensity: true,
  notes: true,
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  userId: true,
  role: true,
  content: true,
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  date: date("date").notNull(),
  time: text("time").notNull(),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAppointmentSchema = createInsertSchema(appointments).pick({
  userId: true,
  title: true,
  description: true,
  date: true,
  time: true,
  location: true,
});

export const dateNights = pgTable("date_nights", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: date("date").notNull(),
  restaurantName: text("restaurant_name").notNull(),
  restaurantSuburb: text("restaurant_suburb"),
  cuisineType: text("cuisine_type"),
  priceRange: text("price_range"),
  summary: text("summary"),
  dietaryNotes: text("dietary_notes"),
  vibe: text("vibe"),
  menuSuggestions: text("menu_suggestions"),
  activity: text("activity"),
  activityLocation: text("activity_location"),
  activityDescription: text("activity_description"),
  status: text("status").notNull().default("planned"),
  rating: integer("rating"),
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDateNightSchema = createInsertSchema(dateNights).pick({
  userId: true,
  date: true,
  restaurantName: true,
  restaurantSuburb: true,
  cuisineType: true,
  priceRange: true,
  summary: true,
  dietaryNotes: true,
  vibe: true,
  menuSuggestions: true,
  activity: true,
  activityLocation: true,
  activityDescription: true,
  status: true,
});

export type DateNight = typeof dateNights.$inferSelect;
export type InsertDateNight = z.infer<typeof insertDateNightSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type ScanResult = typeof scanResults.$inferSelect;
export type InsertScanResult = z.infer<typeof insertScanResultSchema>;
export type MedicalRecord = typeof medicalRecords.$inferSelect;
export type InsertMedicalRecord = z.infer<typeof insertMedicalRecordSchema>;
export type Meal = typeof meals.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;
export type MindBodyActivity = typeof mindBodyActivities.$inferSelect;
export type InsertMindBodyActivity = z.infer<typeof insertMindBodyActivitySchema>;
export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
