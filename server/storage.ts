import { 
  users, chatMessages, scanResults, meals, mindBodyActivities, exercises, medicalRecords, dateNights, appointments, customActivityTypes,
  treatmentPrograms, treatmentSessions,
  type User, type InsertUser, type ChatMessage,
  type ScanResult, type InsertScanResult,
  type Meal, type InsertMeal,
  type MindBodyActivity, type InsertMindBodyActivity,
  type Exercise, type InsertExercise,
  type MedicalRecord, type InsertMedicalRecord,
  type DateNight, type InsertDateNight,
  type Appointment, type InsertAppointment,
  type CustomActivityType, type InsertCustomActivityType,
  type TreatmentProgram, type InsertTreatmentProgram,
  type TreatmentSession, type InsertTreatmentSession,
} from "@shared/schema";
import { updateUserSchema } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte } from "drizzle-orm";
import { z } from "zod";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: z.infer<typeof updateUserSchema>): Promise<User>;
  addChatMessage(userId: number, role: "user" | "assistant", content: string): Promise<void>;
  
  listScanResults(userId: number): Promise<ScanResult[]>;
  createScanResult(data: InsertScanResult): Promise<ScanResult>;
  updateScanResult(id: number, data: Partial<ScanResult>): Promise<ScanResult>;
  deleteScanResult(id: number): Promise<void>;
  
  listMeals(userId: number, dateFrom?: string, dateTo?: string): Promise<Meal[]>;
  createMeal(data: InsertMeal): Promise<Meal>;
  updateMeal(id: number, data: Partial<Meal>): Promise<Meal>;
  deleteMeal(id: number): Promise<void>;
  
  listMindBodyActivities(userId: number, dateFrom?: string, dateTo?: string): Promise<MindBodyActivity[]>;
  createMindBodyActivity(data: InsertMindBodyActivity): Promise<MindBodyActivity>;
  updateMindBodyActivity(id: number, data: Partial<MindBodyActivity>): Promise<MindBodyActivity>;
  deleteMindBodyActivity(id: number): Promise<void>;
  
  listExercises(userId: number, dateFrom?: string, dateTo?: string): Promise<Exercise[]>;
  createExercise(data: InsertExercise): Promise<Exercise>;
  updateExercise(id: number, data: Partial<Exercise>): Promise<Exercise>;
  deleteExercise(id: number): Promise<void>;
  
  listMedicalRecords(userId: number): Promise<MedicalRecord[]>;
  createMedicalRecord(data: InsertMedicalRecord): Promise<MedicalRecord>;
  
  listDateNights(userId: number): Promise<DateNight[]>;
  createDateNight(data: InsertDateNight): Promise<DateNight>;
  updateDateNight(id: number, data: Partial<DateNight>): Promise<DateNight>;
  getDateNight(id: number): Promise<DateNight | undefined>;

  listAppointments(userId: number): Promise<Appointment[]>;
  createAppointment(data: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, data: Partial<Appointment>): Promise<Appointment>;
  deleteAppointment(id: number): Promise<void>;

  listCustomActivityTypes(userId: number, category?: string): Promise<CustomActivityType[]>;
  createCustomActivityType(data: InsertCustomActivityType): Promise<CustomActivityType>;
  updateCustomActivityType(id: number, data: Partial<CustomActivityType>): Promise<CustomActivityType>;
  deleteCustomActivityType(id: number): Promise<void>;

  listTreatmentPrograms(userId: number): Promise<TreatmentProgram[]>;
  getTreatmentProgram(id: number): Promise<TreatmentProgram | undefined>;
  createTreatmentProgram(data: InsertTreatmentProgram): Promise<TreatmentProgram>;
  updateTreatmentProgram(id: number, data: Partial<TreatmentProgram>): Promise<TreatmentProgram>;
  deleteTreatmentProgram(id: number): Promise<void>;

  listTreatmentSessions(programId: number): Promise<TreatmentSession[]>;
  listAllTreatmentSessions(userId: number): Promise<TreatmentSession[]>;
  createTreatmentSession(data: InsertTreatmentSession): Promise<TreatmentSession>;
  updateTreatmentSession(id: number, data: Partial<TreatmentSession>): Promise<TreatmentSession>;
  deleteTreatmentSession(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const userToInsert = {
      ...insertUser,
      cancerType: insertUser.cancerType || null,
      cancerStage: insertUser.cancerStage || null,
      bio: insertUser.bio || null,
      diagnosis_date: insertUser.diagnosis_date || null
    };

    const [user] = await db
      .insert(users)
      .values(userToInsert)
      .returning();
    return user;
  }
  
  async updateUser(id: number, userData: z.infer<typeof updateUserSchema>): Promise<User> {
    const validatedData = updateUserSchema.parse(userData);
    const [updatedUser] = await db
      .update(users)
      .set(validatedData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async addChatMessage(userId: number, role: "user" | "assistant", content: string): Promise<void> {
    await db.insert(chatMessages).values({
      userId,
      role,
      content,
      timestamp: new Date()
    });
  }

  async listScanResults(userId: number): Promise<ScanResult[]> {
    return db.select().from(scanResults).where(eq(scanResults.userId, userId));
  }

  async createScanResult(data: InsertScanResult): Promise<ScanResult> {
    const [result] = await db.insert(scanResults).values(data).returning();
    return result;
  }

  async updateScanResult(id: number, data: Partial<ScanResult>): Promise<ScanResult> {
    const { id: _, createdAt: __, ...updateData } = data as any;
    const [result] = await db.update(scanResults).set(updateData).where(eq(scanResults.id, id)).returning();
    return result;
  }

  async deleteScanResult(id: number): Promise<void> {
    await db.delete(scanResults).where(eq(scanResults.id, id));
  }

  async listMeals(userId: number, dateFrom?: string, dateTo?: string): Promise<Meal[]> {
    const conditions = [eq(meals.userId, userId)];
    if (dateFrom) conditions.push(gte(meals.date, dateFrom));
    if (dateTo) conditions.push(lte(meals.date, dateTo));
    return db.select().from(meals).where(and(...conditions));
  }

  async createMeal(data: InsertMeal): Promise<Meal> {
    const [meal] = await db.insert(meals).values(data).returning();
    return meal;
  }

  async updateMeal(id: number, data: Partial<Meal>): Promise<Meal> {
    const { id: _, createdAt: __, ...updateData } = data as any;
    const [meal] = await db.update(meals).set(updateData).where(eq(meals.id, id)).returning();
    return meal;
  }

  async deleteMeal(id: number): Promise<void> {
    await db.delete(meals).where(eq(meals.id, id));
  }

  async listMindBodyActivities(userId: number, dateFrom?: string, dateTo?: string): Promise<MindBodyActivity[]> {
    const conditions = [eq(mindBodyActivities.userId, userId)];
    if (dateFrom) conditions.push(gte(mindBodyActivities.date, dateFrom));
    if (dateTo) conditions.push(lte(mindBodyActivities.date, dateTo));
    return db.select().from(mindBodyActivities).where(and(...conditions));
  }

  async createMindBodyActivity(data: InsertMindBodyActivity): Promise<MindBodyActivity> {
    const [activity] = await db.insert(mindBodyActivities).values(data).returning();
    return activity;
  }

  async updateMindBodyActivity(id: number, data: Partial<MindBodyActivity>): Promise<MindBodyActivity> {
    const { id: _, createdAt: __, ...updateData } = data as any;
    const [activity] = await db.update(mindBodyActivities).set(updateData).where(eq(mindBodyActivities.id, id)).returning();
    return activity;
  }

  async deleteMindBodyActivity(id: number): Promise<void> {
    await db.delete(mindBodyActivities).where(eq(mindBodyActivities.id, id));
  }

  async listExercises(userId: number, dateFrom?: string, dateTo?: string): Promise<Exercise[]> {
    const conditions = [eq(exercises.userId, userId)];
    if (dateFrom) conditions.push(gte(exercises.date, dateFrom));
    if (dateTo) conditions.push(lte(exercises.date, dateTo));
    return db.select().from(exercises).where(and(...conditions));
  }

  async createExercise(data: InsertExercise): Promise<Exercise> {
    const [exercise] = await db.insert(exercises).values(data).returning();
    return exercise;
  }

  async updateExercise(id: number, data: Partial<Exercise>): Promise<Exercise> {
    const { id: _, createdAt: __, ...updateData } = data as any;
    const [exercise] = await db.update(exercises).set(updateData).where(eq(exercises.id, id)).returning();
    return exercise;
  }

  async deleteExercise(id: number): Promise<void> {
    await db.delete(exercises).where(eq(exercises.id, id));
  }

  async listMedicalRecords(userId: number): Promise<MedicalRecord[]> {
    return db.select().from(medicalRecords).where(eq(medicalRecords.userId, userId));
  }

  async createMedicalRecord(data: InsertMedicalRecord): Promise<MedicalRecord> {
    const [record] = await db.insert(medicalRecords).values(data).returning();
    return record;
  }

  async listDateNights(userId: number): Promise<DateNight[]> {
    return db.select().from(dateNights).where(eq(dateNights.userId, userId));
  }

  async createDateNight(data: InsertDateNight): Promise<DateNight> {
    const [dn] = await db.insert(dateNights).values(data).returning();
    return dn;
  }

  async updateDateNight(id: number, data: Partial<DateNight>): Promise<DateNight> {
    const { id: _, createdAt: __, ...updateData } = data as any;
    const [dn] = await db.update(dateNights).set(updateData).where(eq(dateNights.id, id)).returning();
    return dn;
  }

  async getDateNight(id: number): Promise<DateNight | undefined> {
    const [dn] = await db.select().from(dateNights).where(eq(dateNights.id, id));
    return dn;
  }

  async listAppointments(userId: number): Promise<Appointment[]> {
    return db.select().from(appointments).where(eq(appointments.userId, userId));
  }

  async createAppointment(data: InsertAppointment): Promise<Appointment> {
    const [appt] = await db.insert(appointments).values(data).returning();
    return appt;
  }

  async updateAppointment(id: number, data: Partial<Appointment>): Promise<Appointment> {
    const { id: _, createdAt: __, ...updateData } = data as any;
    const [appt] = await db.update(appointments).set(updateData).where(eq(appointments.id, id)).returning();
    return appt;
  }

  async deleteAppointment(id: number): Promise<void> {
    await db.delete(appointments).where(eq(appointments.id, id));
  }

  async listCustomActivityTypes(userId: number, category?: string): Promise<CustomActivityType[]> {
    const conditions = [eq(customActivityTypes.userId, userId)];
    if (category) conditions.push(eq(customActivityTypes.category, category));
    return db.select().from(customActivityTypes).where(and(...conditions));
  }

  async createCustomActivityType(data: InsertCustomActivityType): Promise<CustomActivityType> {
    const [type] = await db.insert(customActivityTypes).values(data).returning();
    return type;
  }

  async updateCustomActivityType(id: number, data: Partial<CustomActivityType>): Promise<CustomActivityType> {
    const { id: _, ...updateData } = data as any;
    const [type] = await db.update(customActivityTypes).set(updateData).where(eq(customActivityTypes.id, id)).returning();
    return type;
  }

  async deleteCustomActivityType(id: number): Promise<void> {
    await db.delete(customActivityTypes).where(eq(customActivityTypes.id, id));
  }

  async listTreatmentPrograms(userId: number): Promise<TreatmentProgram[]> {
    return db.select().from(treatmentPrograms).where(eq(treatmentPrograms.userId, userId));
  }

  async getTreatmentProgram(id: number): Promise<TreatmentProgram | undefined> {
    const [program] = await db.select().from(treatmentPrograms).where(eq(treatmentPrograms.id, id));
    return program;
  }

  async createTreatmentProgram(data: InsertTreatmentProgram): Promise<TreatmentProgram> {
    const [program] = await db.insert(treatmentPrograms).values(data).returning();
    return program;
  }

  async updateTreatmentProgram(id: number, data: Partial<TreatmentProgram>): Promise<TreatmentProgram> {
    const { id: _, createdAt: __, ...updateData } = data as any;
    const [program] = await db.update(treatmentPrograms).set(updateData).where(eq(treatmentPrograms.id, id)).returning();
    return program;
  }

  async deleteTreatmentProgram(id: number): Promise<void> {
    await db.delete(treatmentSessions).where(eq(treatmentSessions.programId, id));
    await db.delete(treatmentPrograms).where(eq(treatmentPrograms.id, id));
  }

  async listTreatmentSessions(programId: number): Promise<TreatmentSession[]> {
    return db.select().from(treatmentSessions).where(eq(treatmentSessions.programId, programId));
  }

  async listAllTreatmentSessions(userId: number): Promise<TreatmentSession[]> {
    return db.select().from(treatmentSessions).where(eq(treatmentSessions.userId, userId));
  }

  async createTreatmentSession(data: InsertTreatmentSession): Promise<TreatmentSession> {
    const [session] = await db.insert(treatmentSessions).values(data).returning();
    return session;
  }

  async updateTreatmentSession(id: number, data: Partial<TreatmentSession>): Promise<TreatmentSession> {
    const { id: _, createdAt: __, ...updateData } = data as any;
    const [session] = await db.update(treatmentSessions).set(updateData).where(eq(treatmentSessions.id, id)).returning();
    return session;
  }

  async deleteTreatmentSession(id: number): Promise<void> {
    await db.delete(treatmentSessions).where(eq(treatmentSessions.id, id));
  }
}

export const storage = new DatabaseStorage();
