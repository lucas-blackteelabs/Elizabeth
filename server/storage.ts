import { users, chatMessages, type User, type InsertUser, type ChatMessage } from "@shared/schema";
import { updateUserSchema } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { z } from "zod";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: z.infer<typeof updateUserSchema>): Promise<User>;
  addChatMessage(userId: number, role: "user" | "assistant", content: string): Promise<void>;
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
    // Make sure cancerType and cancerStage are not undefined
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
    // Validate and clean the data before updating
    const validatedData = updateUserSchema.parse(userData);
    
    // Update the user record
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
}

export const storage = new DatabaseStorage();
