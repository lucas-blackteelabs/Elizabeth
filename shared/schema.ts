import { pgTable, text, serial, integer, boolean, date, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
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
});

export const updateUserSchema = createInsertSchema(users).omit({
  id: true,
  username: true,
  password: true,
  createdAt: true,
}).partial();

// Medical Tracking
export const medicalRecords = pgTable("medical_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: date("date").notNull(),
  recordType: text("record_type").notNull(), // 'appointment', 'test_result', 'medication', etc.
  title: text("title").notNull(),
  description: text("description"),
  data: jsonb("data"), // For structured data like test results
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

// Nutrition
export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: date("date").notNull(),
  mealType: text("meal_type").notNull(), // 'breakfast', 'lunch', 'dinner', 'snack'
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

// Mind-Body Activities
export const mindBodyActivities = pgTable("mind_body_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: date("date").notNull(),
  activityType: text("activity_type").notNull(), // 'meditation', 'breathing', 'yoga', etc.
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

// Exercises
export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: date("date").notNull(),
  exerciseType: text("exercise_type").notNull(), // 'walking', 'swimming', 'yoga', etc.
  durationMinutes: integer("duration_minutes").notNull(),
  intensity: text("intensity").notNull(), // 'low', 'moderate', 'high'
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

// Chat messages
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  userId: true,
  role: true,
  content: true,
});

// Appointments
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

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
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
