import { 
  users, chatMessages, scanResults, meals, mindBodyActivities, exercises, medicalRecords, dateNights,
  type User, type InsertUser, type ChatMessage,
  type ScanResult, type InsertScanResult,
  type Meal, type InsertMeal,
  type MindBodyActivity, type InsertMindBodyActivity,
  type Exercise, type InsertExercise,
  type MedicalRecord, type InsertMedicalRecord,
  type DateNight, type InsertDateNight,
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
  
  listMeals(userId: number, dateFrom?: string, dateTo?: string): Promise<Meal[]>;
  createMeal(data: InsertMeal): Promise<Meal>;
  
  listMindBodyActivities(userId: number, dateFrom?: string, dateTo?: string): Promise<MindBodyActivity[]>;
  createMindBodyActivity(data: InsertMindBodyActivity): Promise<MindBodyActivity>;
  
  listExercises(userId: number, dateFrom?: string, dateTo?: string): Promise<Exercise[]>;
  createExercise(data: InsertExercise): Promise<Exercise>;
  
  listMedicalRecords(userId: number): Promise<MedicalRecord[]>;
  createMedicalRecord(data: InsertMedicalRecord): Promise<MedicalRecord>;
  
  listDateNights(userId: number): Promise<DateNight[]>;
  createDateNight(data: InsertDateNight): Promise<DateNight>;
  updateDateNight(id: number, data: Partial<DateNight>): Promise<DateNight>;
  getDateNight(id: number): Promise<DateNight | undefined>;
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
}

export const storage = new DatabaseStorage();
