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
  phoneNumber: text("phone_number"),
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
  phoneNumber: true,
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

export const customActivityTypes = pgTable("custom_activity_types", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  category: text("category").notNull(),
  value: text("value").notNull(),
  label: text("label").notNull(),
});

export const insertCustomActivityTypeSchema = createInsertSchema(customActivityTypes).pick({
  userId: true,
  category: true,
  value: true,
  label: true,
});

export type CustomActivityType = typeof customActivityTypes.$inferSelect;
export type InsertCustomActivityType = z.infer<typeof insertCustomActivityTypeSchema>;

export const treatmentPrograms = pgTable("treatment_programs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  category: text("category").notNull().default("medical"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  totalSessions: integer("total_sessions"),
  completedSessions: integer("completed_sessions").default(0),
  frequency: text("frequency"),
  provider: text("provider"),
  location: text("location"),
  notes: text("notes"),
  sideEffects: text("side_effects"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTreatmentProgramSchema = createInsertSchema(treatmentPrograms).pick({
  userId: true,
  name: true,
  type: true,
  category: true,
  startDate: true,
  endDate: true,
  totalSessions: true,
  completedSessions: true,
  frequency: true,
  provider: true,
  location: true,
  notes: true,
  sideEffects: true,
  status: true,
});

export type TreatmentProgram = typeof treatmentPrograms.$inferSelect;
export type InsertTreatmentProgram = z.infer<typeof insertTreatmentProgramSchema>;

export const treatmentSessions = pgTable("treatment_sessions", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull(),
  userId: integer("user_id").notNull(),
  sessionNumber: integer("session_number").notNull(),
  date: date("date"),
  time: text("time"),
  status: text("status").notNull().default("scheduled"),
  notes: text("notes"),
  sideEffects: text("side_effects"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTreatmentSessionSchema = createInsertSchema(treatmentSessions).pick({
  programId: true,
  userId: true,
  sessionNumber: true,
  date: true,
  time: true,
  status: true,
  notes: true,
  sideEffects: true,
});

export type TreatmentSession = typeof treatmentSessions.$inferSelect;
export type InsertTreatmentSession = z.infer<typeof insertTreatmentSessionSchema>;

export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: date("date").notNull(),
  mood: integer("mood"),
  energy: integer("energy"),
  content: text("content").notNull(),
  aiAnalysis: text("ai_analysis"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).pick({
  userId: true,
  date: true,
  mood: true,
  energy: true,
  content: true,
  aiAnalysis: true,
  tags: true,
});

export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;

export const tumourNicknames = pgTable("tumour_nicknames", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  tumourLabel: text("tumour_label").notNull(),
  nickname: text("nickname").notNull(),
});

export const insertTumourNicknameSchema = createInsertSchema(tumourNicknames).pick({
  userId: true,
  tumourLabel: true,
  nickname: true,
});

export type TumourNickname = typeof tumourNicknames.$inferSelect;
export type InsertTumourNickname = z.infer<typeof insertTumourNicknameSchema>;

export const motivationalWallItems = pgTable("motivational_wall_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull().default("text"),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  color: text("color"),
  pinned: boolean("pinned").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMotivationalWallItemSchema = createInsertSchema(motivationalWallItems).pick({
  userId: true,
  type: true,
  content: true,
  imageUrl: true,
  color: true,
  pinned: true,
});

export type MotivationalWallItem = typeof motivationalWallItems.$inferSelect;
export type InsertMotivationalWallItem = z.infer<typeof insertMotivationalWallItemSchema>;

export const communityThreads = pgTable("community_threads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  authorName: text("author_name").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull().default("general"),
  pinned: boolean("pinned").default(false),
  likesCount: integer("likes_count").default(0),
  repliesCount: integer("replies_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCommunityThreadSchema = createInsertSchema(communityThreads).pick({
  userId: true,
  authorName: true,
  title: true,
  content: true,
  category: true,
  pinned: true,
});

export type CommunityThread = typeof communityThreads.$inferSelect;
export type InsertCommunityThread = z.infer<typeof insertCommunityThreadSchema>;

export const communityReplies = pgTable("community_replies", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull(),
  userId: integer("user_id").notNull(),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  likesCount: integer("likes_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCommunityReplySchema = createInsertSchema(communityReplies).pick({
  threadId: true,
  userId: true,
  authorName: true,
  content: true,
});

export type CommunityReply = typeof communityReplies.$inferSelect;
export type InsertCommunityReply = z.infer<typeof insertCommunityReplySchema>;

export const medicalDocuments = pgTable("medical_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  documentType: text("document_type").notNull(),
  date: date("date").notNull(),
  summary: text("summary"),
  notes: text("notes"),
  fileUrl: text("file_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMedicalDocumentSchema = createInsertSchema(medicalDocuments).pick({
  userId: true,
  title: true,
  documentType: true,
  date: true,
  summary: true,
  notes: true,
  fileUrl: true,
});

export type MedicalDocument = typeof medicalDocuments.$inferSelect;
export type InsertMedicalDocument = z.infer<typeof insertMedicalDocumentSchema>;
