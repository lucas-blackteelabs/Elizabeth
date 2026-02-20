import { 
  users, chatMessages, scanResults, meals, mindBodyActivities, exercises, medicalRecords, dateNights, appointments, customActivityTypes,
  treatmentPrograms, treatmentSessions, journalEntries, tumourNicknames, motivationalWallItems,
  communityThreads, communityReplies, medicalDocuments,
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
  type JournalEntry, type InsertJournalEntry,
  type TumourNickname, type InsertTumourNickname,
  type MotivationalWallItem, type InsertMotivationalWallItem,
  type CommunityThread, type InsertCommunityThread,
  type CommunityReply, type InsertCommunityReply,
  type MedicalDocument, type InsertMedicalDocument,
  survivors, survivorAvailability, survivorBookings, survivorTalks, survivorTalkRsvps,
  type Survivor, type InsertSurvivor,
  type SurvivorAvailability, type InsertSurvivorAvailability,
  type SurvivorBooking, type InsertSurvivorBooking,
  type SurvivorTalk, type InsertSurvivorTalk,
  type SurvivorTalkRsvp, type InsertSurvivorTalkRsvp,
  sleepEntries,
  type SleepEntry, type InsertSleepEntry,
  communityGroups, communityGroupMembers, communityGroupPosts, communityGroupPostReplies,
  type CommunityGroup, type InsertCommunityGroup,
  type CommunityGroupMember, type InsertCommunityGroupMember,
  type CommunityGroupPost, type InsertCommunityGroupPost,
  type CommunityGroupPostReply, type InsertCommunityGroupPostReply,
  notifications,
  type Notification, type InsertNotification,
} from "@shared/schema";
import { updateUserSchema } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, isNull, desc, sql, count } from "drizzle-orm";
import { z } from "zod";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  listAllUsers(): Promise<User[]>;
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

  listJournalEntries(userId: number, dateFrom?: string, dateTo?: string): Promise<JournalEntry[]>;
  createJournalEntry(data: InsertJournalEntry): Promise<JournalEntry>;
  updateJournalEntry(id: number, data: Partial<JournalEntry>): Promise<JournalEntry>;
  deleteJournalEntry(id: number): Promise<void>;

  listTumourNicknames(userId: number): Promise<TumourNickname[]>;
  upsertTumourNickname(data: InsertTumourNickname): Promise<TumourNickname>;

  listMotivationalWallItems(userId: number): Promise<MotivationalWallItem[]>;
  createMotivationalWallItem(data: InsertMotivationalWallItem): Promise<MotivationalWallItem>;
  updateMotivationalWallItem(id: number, data: Partial<MotivationalWallItem>): Promise<MotivationalWallItem>;
  deleteMotivationalWallItem(id: number): Promise<void>;

  listCommunityThreads(): Promise<CommunityThread[]>;
  getCommunityThread(id: number): Promise<CommunityThread | undefined>;
  createCommunityThread(data: InsertCommunityThread): Promise<CommunityThread>;
  updateCommunityThread(id: number, data: Partial<CommunityThread>): Promise<CommunityThread>;
  deleteCommunityThread(id: number): Promise<void>;

  listCommunityReplies(threadId: number): Promise<CommunityReply[]>;
  createCommunityReply(data: InsertCommunityReply): Promise<CommunityReply>;
  deleteCommunityReply(id: number): Promise<void>;

  listMedicalDocuments(userId: number): Promise<MedicalDocument[]>;
  createMedicalDocument(data: InsertMedicalDocument): Promise<MedicalDocument>;
  updateMedicalDocument(id: number, data: Partial<MedicalDocument>): Promise<MedicalDocument>;
  deleteMedicalDocument(id: number): Promise<void>;

  listSurvivors(): Promise<Survivor[]>;
  getSurvivor(id: number): Promise<Survivor | undefined>;
  createSurvivor(data: InsertSurvivor): Promise<Survivor>;

  listSurvivorAvailability(survivorId: number): Promise<SurvivorAvailability[]>;
  createSurvivorAvailability(data: InsertSurvivorAvailability): Promise<SurvivorAvailability>;

  createSurvivorBooking(data: InsertSurvivorBooking): Promise<SurvivorBooking>;
  listSurvivorBookings(userId: number): Promise<SurvivorBooking[]>;
  cancelSurvivorBooking(id: number): Promise<void>;

  listSurvivorTalks(): Promise<SurvivorTalk[]>;
  createSurvivorTalk(data: InsertSurvivorTalk): Promise<SurvivorTalk>;

  listSurvivorTalkRsvps(talkId: number): Promise<SurvivorTalkRsvp[]>;
  listUserRsvps(userId: number): Promise<SurvivorTalkRsvp[]>;
  createSurvivorTalkRsvp(data: InsertSurvivorTalkRsvp): Promise<SurvivorTalkRsvp>;
  deleteSurvivorTalkRsvp(talkId: number, userId: number): Promise<void>;

  listSleepEntries(userId: number, dateFrom?: string, dateTo?: string): Promise<SleepEntry[]>;
  createSleepEntry(data: InsertSleepEntry): Promise<SleepEntry>;
  updateSleepEntry(id: number, data: Partial<SleepEntry>): Promise<SleepEntry>;
  deleteSleepEntry(id: number): Promise<void>;

  listCommunityGroups(): Promise<CommunityGroup[]>;
  getCommunityGroup(id: number): Promise<CommunityGroup | undefined>;
  createCommunityGroup(data: InsertCommunityGroup): Promise<CommunityGroup>;

  listGroupMembers(groupId: number): Promise<CommunityGroupMember[]>;
  listUserGroupMemberships(userId: number): Promise<CommunityGroupMember[]>;
  joinGroup(data: InsertCommunityGroupMember): Promise<CommunityGroupMember>;
  leaveGroup(groupId: number, userId: number): Promise<void>;

  listGroupPosts(groupId: number): Promise<CommunityGroupPost[]>;
  createGroupPost(data: InsertCommunityGroupPost): Promise<CommunityGroupPost>;
  updateGroupPost(id: number, data: Partial<CommunityGroupPost>): Promise<CommunityGroupPost>;
  deleteGroupPost(id: number): Promise<void>;

  listGroupPostReplies(postId: number): Promise<CommunityGroupPostReply[]>;
  createGroupPostReply(data: InsertCommunityGroupPostReply): Promise<CommunityGroupPostReply>;
  deleteGroupPostReply(id: number): Promise<void>;

  listNotifications(userId: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  createNotification(data: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number, userId: number): Promise<void>;
  markAllNotificationsRead(userId: number): Promise<void>;
  createBroadcastNotification(data: Omit<InsertNotification, "userId">): Promise<void>;
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

  async listAllUsers(): Promise<User[]> {
    return db.select().from(users);
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

  async listJournalEntries(userId: number, dateFrom?: string, dateTo?: string): Promise<JournalEntry[]> {
    const conditions = [eq(journalEntries.userId, userId)];
    if (dateFrom) conditions.push(gte(journalEntries.date, dateFrom));
    if (dateTo) conditions.push(lte(journalEntries.date, dateTo));
    return db.select().from(journalEntries).where(and(...conditions));
  }

  async createJournalEntry(data: InsertJournalEntry): Promise<JournalEntry> {
    const [entry] = await db.insert(journalEntries).values(data).returning();
    return entry;
  }

  async updateJournalEntry(id: number, data: Partial<JournalEntry>): Promise<JournalEntry> {
    const { id: _, createdAt: __, ...updateData } = data as any;
    const [entry] = await db.update(journalEntries).set(updateData).where(eq(journalEntries.id, id)).returning();
    return entry;
  }

  async deleteJournalEntry(id: number): Promise<void> {
    await db.delete(journalEntries).where(eq(journalEntries.id, id));
  }

  async listTumourNicknames(userId: number): Promise<TumourNickname[]> {
    return db.select().from(tumourNicknames).where(eq(tumourNicknames.userId, userId));
  }

  async upsertTumourNickname(data: InsertTumourNickname): Promise<TumourNickname> {
    const existing = await db.select().from(tumourNicknames)
      .where(and(eq(tumourNicknames.userId, data.userId), eq(tumourNicknames.tumourLabel, data.tumourLabel)));
    if (existing.length > 0) {
      const [updated] = await db.update(tumourNicknames).set({ nickname: data.nickname })
        .where(eq(tumourNicknames.id, existing[0].id)).returning();
      return updated;
    }
    const [created] = await db.insert(tumourNicknames).values(data).returning();
    return created;
  }

  async listMotivationalWallItems(userId: number): Promise<MotivationalWallItem[]> {
    return db.select().from(motivationalWallItems).where(eq(motivationalWallItems.userId, userId));
  }

  async createMotivationalWallItem(data: InsertMotivationalWallItem): Promise<MotivationalWallItem> {
    const [item] = await db.insert(motivationalWallItems).values(data).returning();
    return item;
  }

  async updateMotivationalWallItem(id: number, data: Partial<MotivationalWallItem>): Promise<MotivationalWallItem> {
    const { id: _, createdAt: __, ...updateData } = data as any;
    const [item] = await db.update(motivationalWallItems).set(updateData).where(eq(motivationalWallItems.id, id)).returning();
    return item;
  }

  async deleteMotivationalWallItem(id: number): Promise<void> {
    await db.delete(motivationalWallItems).where(eq(motivationalWallItems.id, id));
  }

  async listCommunityThreads(): Promise<CommunityThread[]> {
    return db.select().from(communityThreads).orderBy(communityThreads.createdAt);
  }

  async getCommunityThread(id: number): Promise<CommunityThread | undefined> {
    const [thread] = await db.select().from(communityThreads).where(eq(communityThreads.id, id));
    return thread;
  }

  async createCommunityThread(data: InsertCommunityThread): Promise<CommunityThread> {
    const [thread] = await db.insert(communityThreads).values(data).returning();
    return thread;
  }

  async updateCommunityThread(id: number, data: Partial<CommunityThread>): Promise<CommunityThread> {
    const { id: _, createdAt: __, ...updateData } = data as any;
    const [thread] = await db.update(communityThreads).set(updateData).where(eq(communityThreads.id, id)).returning();
    return thread;
  }

  async deleteCommunityThread(id: number): Promise<void> {
    await db.delete(communityReplies).where(eq(communityReplies.threadId, id));
    await db.delete(communityThreads).where(eq(communityThreads.id, id));
  }

  async listCommunityReplies(threadId: number): Promise<CommunityReply[]> {
    return db.select().from(communityReplies).where(eq(communityReplies.threadId, threadId)).orderBy(communityReplies.createdAt);
  }

  async createCommunityReply(data: InsertCommunityReply): Promise<CommunityReply> {
    const [reply] = await db.insert(communityReplies).values(data).returning();
    await db.update(communityThreads)
      .set({ repliesCount: (await this.listCommunityReplies(data.threadId)).length })
      .where(eq(communityThreads.id, data.threadId));
    return reply;
  }

  async deleteCommunityReply(id: number): Promise<void> {
    const [reply] = await db.select().from(communityReplies).where(eq(communityReplies.id, id));
    if (reply) {
      await db.delete(communityReplies).where(eq(communityReplies.id, id));
      const remaining = await this.listCommunityReplies(reply.threadId);
      await db.update(communityThreads)
        .set({ repliesCount: remaining.length })
        .where(eq(communityThreads.id, reply.threadId));
    }
  }

  async listMedicalDocuments(userId: number): Promise<MedicalDocument[]> {
    return db.select().from(medicalDocuments).where(eq(medicalDocuments.userId, userId));
  }

  async createMedicalDocument(data: InsertMedicalDocument): Promise<MedicalDocument> {
    const [doc] = await db.insert(medicalDocuments).values(data).returning();
    return doc;
  }

  async updateMedicalDocument(id: number, data: Partial<MedicalDocument>): Promise<MedicalDocument> {
    const { id: _, createdAt: __, ...updateData } = data as any;
    const [doc] = await db.update(medicalDocuments).set(updateData).where(eq(medicalDocuments.id, id)).returning();
    return doc;
  }

  async deleteMedicalDocument(id: number): Promise<void> {
    await db.delete(medicalDocuments).where(eq(medicalDocuments.id, id));
  }

  async listSurvivors(): Promise<Survivor[]> {
    return db.select().from(survivors).orderBy(survivors.createdAt);
  }

  async getSurvivor(id: number): Promise<Survivor | undefined> {
    const [s] = await db.select().from(survivors).where(eq(survivors.id, id));
    return s;
  }

  async createSurvivor(data: InsertSurvivor): Promise<Survivor> {
    const [s] = await db.insert(survivors).values(data).returning();
    return s;
  }

  async listSurvivorAvailability(survivorId: number): Promise<SurvivorAvailability[]> {
    return db.select().from(survivorAvailability)
      .where(eq(survivorAvailability.survivorId, survivorId))
      .orderBy(survivorAvailability.date);
  }

  async createSurvivorAvailability(data: InsertSurvivorAvailability): Promise<SurvivorAvailability> {
    const [slot] = await db.insert(survivorAvailability).values(data).returning();
    return slot;
  }

  async createSurvivorBooking(data: InsertSurvivorBooking): Promise<SurvivorBooking> {
    const [slot] = await db.select().from(survivorAvailability).where(eq(survivorAvailability.id, data.slotId));
    if (!slot || slot.booked) {
      throw new Error("Slot is no longer available");
    }
    await db.update(survivorAvailability).set({ booked: true }).where(eq(survivorAvailability.id, data.slotId));
    const [booking] = await db.insert(survivorBookings).values(data).returning();
    return booking;
  }

  async listSurvivorBookings(userId: number): Promise<SurvivorBooking[]> {
    return db.select().from(survivorBookings)
      .where(eq(survivorBookings.userId, userId))
      .orderBy(survivorBookings.createdAt);
  }

  async cancelSurvivorBooking(id: number): Promise<void> {
    const [booking] = await db.select().from(survivorBookings).where(eq(survivorBookings.id, id));
    if (booking) {
      await db.update(survivorAvailability).set({ booked: false }).where(eq(survivorAvailability.id, booking.slotId));
      await db.delete(survivorBookings).where(eq(survivorBookings.id, id));
    }
  }

  async listSurvivorTalks(): Promise<SurvivorTalk[]> {
    return db.select().from(survivorTalks).orderBy(survivorTalks.scheduledAt);
  }

  async createSurvivorTalk(data: InsertSurvivorTalk): Promise<SurvivorTalk> {
    const [talk] = await db.insert(survivorTalks).values(data).returning();
    return talk;
  }

  async listSurvivorTalkRsvps(talkId: number): Promise<SurvivorTalkRsvp[]> {
    return db.select().from(survivorTalkRsvps).where(eq(survivorTalkRsvps.talkId, talkId));
  }

  async listUserRsvps(userId: number): Promise<SurvivorTalkRsvp[]> {
    return db.select().from(survivorTalkRsvps).where(eq(survivorTalkRsvps.userId, userId));
  }

  async createSurvivorTalkRsvp(data: InsertSurvivorTalkRsvp): Promise<SurvivorTalkRsvp> {
    const existing = await db.select().from(survivorTalkRsvps)
      .where(and(eq(survivorTalkRsvps.talkId, data.talkId), eq(survivorTalkRsvps.userId, data.userId)));
    if (existing.length > 0) return existing[0];
    const [rsvp] = await db.insert(survivorTalkRsvps).values(data).returning();
    await db.update(survivorTalks)
      .set({ rsvpCount: (await this.listSurvivorTalkRsvps(data.talkId)).length })
      .where(eq(survivorTalks.id, data.talkId));
    return rsvp;
  }

  async deleteSurvivorTalkRsvp(talkId: number, userId: number): Promise<void> {
    await db.delete(survivorTalkRsvps)
      .where(and(eq(survivorTalkRsvps.talkId, talkId), eq(survivorTalkRsvps.userId, userId)));
    await db.update(survivorTalks)
      .set({ rsvpCount: (await this.listSurvivorTalkRsvps(talkId)).length })
      .where(eq(survivorTalks.id, talkId));
  }

  async listSleepEntries(userId: number, dateFrom?: string, dateTo?: string): Promise<SleepEntry[]> {
    const conditions = [eq(sleepEntries.userId, userId)];
    if (dateFrom) conditions.push(gte(sleepEntries.date, dateFrom));
    if (dateTo) conditions.push(lte(sleepEntries.date, dateTo));
    return db.select().from(sleepEntries).where(and(...conditions)).orderBy(sleepEntries.date);
  }

  async createSleepEntry(data: InsertSleepEntry): Promise<SleepEntry> {
    const [entry] = await db.insert(sleepEntries).values(data).returning();
    return entry;
  }

  async updateSleepEntry(id: number, data: Partial<SleepEntry>): Promise<SleepEntry> {
    const [entry] = await db.update(sleepEntries).set(data).where(eq(sleepEntries.id, id)).returning();
    return entry;
  }

  async deleteSleepEntry(id: number): Promise<void> {
    await db.delete(sleepEntries).where(eq(sleepEntries.id, id));
  }

  async listCommunityGroups(): Promise<CommunityGroup[]> {
    return db.select().from(communityGroups).orderBy(communityGroups.name);
  }

  async getCommunityGroup(id: number): Promise<CommunityGroup | undefined> {
    const [group] = await db.select().from(communityGroups).where(eq(communityGroups.id, id));
    return group;
  }

  async createCommunityGroup(data: InsertCommunityGroup): Promise<CommunityGroup> {
    const [group] = await db.insert(communityGroups).values(data).returning();
    return group;
  }

  async listGroupMembers(groupId: number): Promise<CommunityGroupMember[]> {
    return db.select().from(communityGroupMembers).where(eq(communityGroupMembers.groupId, groupId));
  }

  async listUserGroupMemberships(userId: number): Promise<CommunityGroupMember[]> {
    return db.select().from(communityGroupMembers).where(eq(communityGroupMembers.userId, userId));
  }

  async joinGroup(data: InsertCommunityGroupMember): Promise<CommunityGroupMember> {
    const existing = await db.select().from(communityGroupMembers)
      .where(and(eq(communityGroupMembers.groupId, data.groupId), eq(communityGroupMembers.userId, data.userId)));
    if (existing.length > 0) return existing[0];
    const [member] = await db.insert(communityGroupMembers).values(data).returning();
    const members = await this.listGroupMembers(data.groupId);
    await db.update(communityGroups).set({ memberCount: members.length }).where(eq(communityGroups.id, data.groupId));
    return member;
  }

  async leaveGroup(groupId: number, userId: number): Promise<void> {
    await db.delete(communityGroupMembers)
      .where(and(eq(communityGroupMembers.groupId, groupId), eq(communityGroupMembers.userId, userId)));
    const members = await this.listGroupMembers(groupId);
    await db.update(communityGroups).set({ memberCount: members.length }).where(eq(communityGroups.id, groupId));
  }

  async listGroupPosts(groupId: number): Promise<CommunityGroupPost[]> {
    return db.select().from(communityGroupPosts)
      .where(eq(communityGroupPosts.groupId, groupId))
      .orderBy(communityGroupPosts.createdAt);
  }

  async createGroupPost(data: InsertCommunityGroupPost): Promise<CommunityGroupPost> {
    const [post] = await db.insert(communityGroupPosts).values(data).returning();
    const posts = await this.listGroupPosts(data.groupId);
    await db.update(communityGroups).set({ postCount: posts.length }).where(eq(communityGroups.id, data.groupId));
    return post;
  }

  async updateGroupPost(id: number, data: Partial<CommunityGroupPost>): Promise<CommunityGroupPost> {
    const [post] = await db.update(communityGroupPosts).set(data).where(eq(communityGroupPosts.id, id)).returning();
    return post;
  }

  async deleteGroupPost(id: number): Promise<void> {
    await db.delete(communityGroupPostReplies).where(eq(communityGroupPostReplies.postId, id));
    const [post] = await db.select().from(communityGroupPosts).where(eq(communityGroupPosts.id, id));
    await db.delete(communityGroupPosts).where(eq(communityGroupPosts.id, id));
    if (post) {
      const posts = await this.listGroupPosts(post.groupId);
      await db.update(communityGroups).set({ postCount: posts.length }).where(eq(communityGroups.id, post.groupId));
    }
  }

  async listGroupPostReplies(postId: number): Promise<CommunityGroupPostReply[]> {
    return db.select().from(communityGroupPostReplies)
      .where(eq(communityGroupPostReplies.postId, postId))
      .orderBy(communityGroupPostReplies.createdAt);
  }

  async createGroupPostReply(data: InsertCommunityGroupPostReply): Promise<CommunityGroupPostReply> {
    const [reply] = await db.insert(communityGroupPostReplies).values(data).returning();
    const replies = await this.listGroupPostReplies(data.postId);
    await db.update(communityGroupPosts).set({ repliesCount: replies.length }).where(eq(communityGroupPosts.id, data.postId));
    return reply;
  }

  async deleteGroupPostReply(id: number): Promise<void> {
    const [reply] = await db.select().from(communityGroupPostReplies).where(eq(communityGroupPostReplies.id, id));
    await db.delete(communityGroupPostReplies).where(eq(communityGroupPostReplies.id, id));
    if (reply) {
      const replies = await this.listGroupPostReplies(reply.postId);
      await db.update(communityGroupPosts).set({ repliesCount: replies.length }).where(eq(communityGroupPosts.id, reply.postId));
    }
  }

  async listNotifications(userId: number): Promise<Notification[]> {
    return db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const [result] = await db.select({ count: count() }).from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    return result?.count || 0;
  }

  async createNotification(data: InsertNotification): Promise<Notification> {
    const [notif] = await db.insert(notifications).values(data).returning();
    return notif;
  }

  async markNotificationRead(id: number, userId: number): Promise<void> {
    await db.update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }

  async markAllNotificationsRead(userId: number): Promise<void> {
    await db.update(notifications)
      .set({ readAt: new Date() })
      .where(eq(notifications.userId, userId));
  }

  async createBroadcastNotification(data: Omit<InsertNotification, "userId">): Promise<void> {
    const allUsers = await db.select({ id: users.id }).from(users);
    const values = allUsers.map(u => ({ ...data, userId: u.id }));
    if (values.length > 0) {
      await db.insert(notifications).values(values);
    }
  }
}

export const storage = new DatabaseStorage();
