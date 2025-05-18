import { users, type User, type InsertUser, type ChatMessage } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  addChatMessage(userId: number, role: "user" | "assistant", content: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private chatMessages: Map<number, ChatMessage[]>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.chatMessages = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }
  
  async addChatMessage(userId: number, role: "user" | "assistant", content: string): Promise<void> {
    if (!this.chatMessages.has(userId)) {
      this.chatMessages.set(userId, []);
    }
    
    const userMessages = this.chatMessages.get(userId)!;
    userMessages.push({
      id: userMessages.length + 1,
      userId,
      role,
      content,
      timestamp: new Date()
    });
  }
}

export const storage = new MemStorage();
