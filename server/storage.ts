import { 
  users, 
  units, 
  notes, 
  assignments, 
  pastPapers,
  completedAssignments,
  userNoteViews,
  userPaperViews,
  type User, 
  type Unit, 
  type Note, 
  type Assignment,
  type PastPaper,
  type InsertNote,
  type InsertAssignment,
  type InsertPastPaper,
  type InsertCompletedAssignment
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, lt, gte, sql, isNull } from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { formatDistance, isPast } from "date-fns";
import pg from "pg";

const PostgresStore = connectPgSimple(session);
const scryptAsync = promisify(scrypt);

export interface IStorage {
  sessionStore: session.Store;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByCredentials(name: string, admissionNumber: string): Promise<User | undefined>;
  updateUserPassword(id: number, hashedPassword: string): Promise<User>;
  updateUserProfileImage(id: number, imageUrl: string): Promise<User>;
  
  // Dashboard methods
  getDashboardStats(userId: number): Promise<any>;
  getUserActivities(userId: number): Promise<any[]>;
  getUpcomingDeadlines(userId: number): Promise<any[]>;
  
  // Unit methods
  getAllUnits(userId: number): Promise<any[]>;
  getUnitByCode(unitCode: string): Promise<Unit | undefined>;
  
  // Notes methods
  getNotesByUnit(unitCode: string, userId: number): Promise<any[]>;
  createNote(data: InsertNote & { userId: number }): Promise<any>;
  deleteNote(noteId: number, userId: number): Promise<any | null>;
  markNoteAsViewed(noteId: number, userId: number): Promise<void>;
  
  // Assignment methods
  getAssignmentsByUnit(unitCode: string, userId: number): Promise<any[]>;
  createAssignment(data: InsertAssignment & { userId: number }): Promise<any>;
  deleteAssignment(assignmentId: number, userId: number): Promise<any | null>;
  completeAssignment(assignmentId: number, userId: number): Promise<any>;
  
  // Past papers methods
  getPastPapersByUnit(unitCode: string, userId: number): Promise<any[]>;
  createPastPaper(data: InsertPastPaper & { userId: number }): Promise<any>;
  deletePastPaper(paperId: number, userId: number): Promise<any | null>;
  markPastPaperAsViewed(paperId: number, userId: number): Promise<void>;
  
  // Ranking methods
  getUnitRankings(unitCode: string): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    // Create a PostgreSQL connection pool for the session store
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    // Initialize session store with PostgreSQL
    this.sessionStore = new PostgresStore({
      pool,
      createTableIfMissing: true
    });
    
    // Make sure uploads directory exists
    this.initializeStorage();
  }
  
  private async initializeStorage() {
    // Make sure uploads directory exists
    const fs = await import('fs');
    const path = await import('path');
    
    const uploadDir = path.join(process.cwd(), 'uploads');
    fs.mkdirSync(uploadDir, { recursive: true });
    
    const filesDir = path.join(uploadDir, 'files');
    fs.mkdirSync(filesDir, { recursive: true });
    
    const profilesDir = path.join(uploadDir, 'profiles');
    fs.mkdirSync(profilesDir, { recursive: true });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByCredentials(name: string, admissionNumber: string): Promise<User | undefined> {
    try {
      // First try exact match (case-sensitive)
      let [user] = await db.select()
        .from(users)
        .where(
          and(
            eq(users.name, name),
            eq(users.admissionNumber, admissionNumber)
          )
        );

      if (user) return user;

      // If no match, try with more flexible approach
      console.log(`No exact match found, doing flexible search for ${name}, ${admissionNumber}`);
      
      // Get all users and do case-insensitive comparison
      const allUsers = await db.select().from(users);
      console.log(`Total users in database: ${allUsers.length}`);
      
      // Log the first few users for debugging
      if (allUsers.length > 0) {
        console.log(`USERS IN DATABASE: ${allUsers.length} users found`);
        console.log(`FIRST USER: ${JSON.stringify(allUsers[0])}`);
      }
      
      // Find a match using case-insensitive string comparison
      user = allUsers.find(u => 
        u.name.toLowerCase() === name.toLowerCase() && 
        u.admissionNumber.toLowerCase() === admissionNumber.toLowerCase()
      );
      
      if (user) {
        console.log(`Found user with flexible matching: ${user.name} (ID: ${user.id})`);
      } else {
        console.log(`No user found with name "${name}" and admission "${admissionNumber}"`);
      }
      
      return user;
    } catch (error) {
      console.error("Error getting user by credentials:", error);
      return undefined;
    }
  }
  
  async updateUserPassword(id: number, hashedPassword: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async updateUserProfileImage(id: number, imageUrl: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ profileImageUrl: imageUrl })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  // Dashboard methods
  async getDashboardStats(userId: number): Promise<any> {
    // Count unread notes
    const [notesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notes)
      .leftJoin(
        userNoteViews,
        and(
          eq(notes.id, userNoteViews.noteId),
          eq(userNoteViews.userId, userId)
        )
      )
      .where(isNull(userNoteViews.id));
    
    // Count pending assignments
    const [assignmentsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(assignments)
      .leftJoin(
        completedAssignments,
        and(
          eq(assignments.id, completedAssignments.assignmentId),
          eq(completedAssignments.userId, userId)
        )
      )
      .where(isNull(completedAssignments.id));
    
    // Count unread past papers
    const [pastPapersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pastPapers)
      .leftJoin(
        userPaperViews,
        and(
          eq(pastPapers.id, userPaperViews.paperId),
          eq(userPaperViews.userId, userId)
        )
      )
      .where(isNull(userPaperViews.id));
    
    // Count overdue assignments
    const [overdueResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(assignments)
      .leftJoin(
        completedAssignments,
        and(
          eq(assignments.id, completedAssignments.assignmentId),
          eq(completedAssignments.userId, userId)
        )
      )
      .where(
        and(
          lt(assignments.deadline, new Date()),
          isNull(completedAssignments.id)
        )
      );
    
    // Count pending assignments
    const [pendingResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(assignments)
      .leftJoin(
        completedAssignments,
        and(
          eq(assignments.id, completedAssignments.assignmentId),
          eq(completedAssignments.userId, userId)
        )
      )
      .where(
        and(
          gte(assignments.deadline, new Date()),
          isNull(completedAssignments.id)
        )
      );
    
    // Get user rank
    const userRank = await this.getUserRank(userId);
    
    return {
      assignmentsCount: assignmentsResult.count,
      notesCount: notesResult.count,
      pastPapersCount: pastPapersResult.count,
      rank: userRank,
      overdue: overdueResult.count,
      pending: pendingResult.count
    };
  }
  
  private async getUserRank(userId: number): Promise<number> {
    // This would calculate the user's overall rank based on assignment completion times
    // For now, return a placeholder rank
    return 3;
  }
  
  async getUserActivities(userId: number): Promise<any[]> {
    // Get the most recent activities (completed assignments, viewed notes, etc.)
    const completedAssignmentsActivity = await db
      .select({
        id: completedAssignments.id,
        type: sql<string>`'assignment'`.as('type'),
        title: sql<string>`${'Completed Assignment: '} || ${assignments.title}`.as('title'),
        unitCode: assignments.unitCode,
        timestamp: completedAssignments.completedAt
      })
      .from(completedAssignments)
      .innerJoin(assignments, eq(completedAssignments.assignmentId, assignments.id))
      .where(eq(completedAssignments.userId, userId))
      .orderBy(desc(completedAssignments.completedAt))
      .limit(5);
    
    const viewedNotesActivity = await db
      .select({
        id: userNoteViews.id,
        type: sql<string>`'note'`.as('type'),
        title: sql<string>`${'Viewed Note: '} || ${notes.title}`.as('title'),
        unitCode: notes.unitCode,
        timestamp: userNoteViews.viewedAt
      })
      .from(userNoteViews)
      .innerJoin(notes, eq(userNoteViews.noteId, notes.id))
      .where(eq(userNoteViews.userId, userId))
      .orderBy(desc(userNoteViews.viewedAt))
      .limit(5);
    
    const viewedPapersActivity = await db
      .select({
        id: userPaperViews.id,
        type: sql<string>`'pastpaper'`.as('type'),
        title: sql<string>`${'Downloaded: '} || ${pastPapers.title}`.as('title'),
        unitCode: pastPapers.unitCode,
        timestamp: userPaperViews.viewedAt
      })
      .from(userPaperViews)
      .innerJoin(pastPapers, eq(userPaperViews.paperId, pastPapers.id))
      .where(eq(userPaperViews.userId, userId))
      .orderBy(desc(userPaperViews.viewedAt))
      .limit(5);
    
    // Combine and sort activities
    const allActivities = [
      ...completedAssignmentsActivity,
      ...viewedNotesActivity,
      ...viewedPapersActivity
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
    
    return allActivities;
  }
  
  async getUpcomingDeadlines(userId: number): Promise<any[]> {
    // Get upcoming deadlines for assignments
    const upcomingAssignments = await db
      .select({
        id: assignments.id,
        title: assignments.title,
        description: assignments.description,
        unitCode: assignments.unitCode,
        deadline: assignments.deadline,
        fileUrl: assignments.fileUrl,
        createdAt: assignments.createdAt,
        uploadedBy: users.name,
        completed: sql<boolean>`CASE WHEN ${completedAssignments.id} IS NOT NULL THEN TRUE ELSE FALSE END`.as('completed'),
        completedAt: completedAssignments.completedAt
      })
      .from(assignments)
      .innerJoin(users, eq(assignments.userId, users.id))
      .leftJoin(
        completedAssignments,
        and(
          eq(assignments.id, completedAssignments.assignmentId),
          eq(completedAssignments.userId, userId)
        )
      )
      .orderBy(assignments.deadline)
      .limit(5);
    
    return upcomingAssignments;
  }
  
  // Unit methods
  async getAllUnits(userId: number): Promise<any[]> {
    const allUnits = await db.select().from(units);
    
    // For each unit, calculate notification count
    const unitsWithNotifications = await Promise.all(
      allUnits.map(async (unit) => {
        // Calculate unread notes count
        const notesQuery = await db.execute(sql`
          SELECT COUNT(*) as count 
          FROM ${notes} 
          LEFT JOIN ${userNoteViews} ON ${notes.id} = ${userNoteViews.noteId}
          AND ${userNoteViews.userId} = ${userId}
          WHERE ${notes.unitCode} = ${unit.unitCode}
          AND ${userNoteViews.id} IS NULL
        `);
        const [unreadNotes] = notesQuery;
        
        // Calculate uncompleted assignments count
        const assignmentsQuery = await db.execute(sql`
          SELECT COUNT(*) as count 
          FROM ${assignments} 
          LEFT JOIN ${completedAssignments} ON ${assignments.id} = ${completedAssignments.assignmentId}
          AND ${completedAssignments.userId} = ${userId}
          WHERE ${assignments.unitCode} = ${unit.unitCode}
          AND ${completedAssignments.id} IS NULL
        `);
        const [pendingAssignments] = assignmentsQuery;
        
        // Calculate unread past papers count
        const papersQuery = await db.execute(sql`
          SELECT COUNT(*) as count 
          FROM ${pastPapers} 
          LEFT JOIN ${userPaperViews} ON ${pastPapers.id} = ${userPaperViews.paperId}
          AND ${userPaperViews.userId} = ${userId}
          WHERE ${pastPapers.unitCode} = ${unit.unitCode}
          AND ${userPaperViews.id} IS NULL
        `);
        const [unreadPapers] = papersQuery;
        
        // Just use one total for all notifications combined
        const notificationCount = 
          parseInt(unreadNotes.count as string) + 
          parseInt(pendingAssignments.count as string) + 
          parseInt(unreadPapers.count as string);
        
        return {
          ...unit,
          notificationCount
        };
      })
    );
    
    return unitsWithNotifications;
  }
  
  async getUnitByCode(unitCode: string): Promise<Unit | undefined> {
    const [unit] = await db
      .select()
      .from(units)
      .where(eq(units.unitCode, unitCode));
    return unit;
  }
  
  // Notes methods
  async getNotesByUnit(unitCode: string, userId: number): Promise<any[]> {
    const unitNotes = await db
      .select({
        id: notes.id,
        title: notes.title,
        description: notes.description,
        fileUrl: notes.fileUrl,
        unitCode: notes.unitCode,
        createdAt: notes.createdAt,
        uploadedBy: users.name,
        uploaderImageUrl: users.profileImageUrl,
        viewed: sql<boolean>`CASE WHEN ${userNoteViews.id} IS NOT NULL THEN TRUE ELSE FALSE END`.as('viewed')
      })
      .from(notes)
      .where(eq(notes.unitCode, unitCode))
      .innerJoin(users, eq(notes.userId, users.id))
      .leftJoin(
        userNoteViews,
        and(
          eq(notes.id, userNoteViews.noteId),
          eq(userNoteViews.userId, userId)
        )
      )
      .orderBy(desc(notes.createdAt));
    
    return unitNotes;
  }
  
  async createNote(data: InsertNote & { userId: number }): Promise<any> {
    const [newNote] = await db
      .insert(notes)
      .values({
        title: data.title,
        description: data.description,
        fileUrl: data.fileUrl,
        unitCode: data.unitCode,
        userId: data.userId,
      })
      .returning();
    
    const [uploader] = await db
      .select({ name: users.name, profileImageUrl: users.profileImageUrl })
      .from(users)
      .where(eq(users.id, data.userId));
    
    return {
      ...newNote,
      uploadedBy: uploader.name,
      uploaderImageUrl: uploader.profileImageUrl,
      viewed: false
    };
  }
  
  async deleteNote(noteId: number, userId: number): Promise<any | null> {
    // First verify that the note exists and belongs to the user
    const [note] = await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.id, noteId),
          eq(notes.userId, userId)
        )
      );
    
    if (!note) {
      return null; // Note not found or doesn't belong to the user
    }
    
    // Delete associated views
    await db
      .delete(userNoteViews)
      .where(eq(userNoteViews.noteId, noteId));
    
    // Delete the note
    const [deletedNote] = await db
      .delete(notes)
      .where(eq(notes.id, noteId))
      .returning();
    
    return deletedNote;
  }
  
  async markNoteAsViewed(noteId: number, userId: number): Promise<void> {
    // Check if already viewed
    const [existingView] = await db
      .select()
      .from(userNoteViews)
      .where(
        and(
          eq(userNoteViews.noteId, noteId),
          eq(userNoteViews.userId, userId)
        )
      );
    
    if (!existingView) {
      await db
        .insert(userNoteViews)
        .values({
          noteId,
          userId,
          viewedAt: new Date()
        });
    }
  }
  
  // Assignment methods
  async getAssignmentsByUnit(unitCode: string, userId: number): Promise<any[]> {
    const unitAssignments = await db
      .select({
        id: assignments.id,
        title: assignments.title,
        description: assignments.description,
        deadline: assignments.deadline,
        fileUrl: assignments.fileUrl,
        unitCode: assignments.unitCode,
        createdAt: assignments.createdAt,
        uploadedBy: users.name,
        completed: sql<boolean>`CASE WHEN ${completedAssignments.id} IS NOT NULL THEN TRUE ELSE FALSE END`.as('completed'),
        completedAt: completedAssignments.completedAt
      })
      .from(assignments)
      .where(eq(assignments.unitCode, unitCode))
      .innerJoin(users, eq(assignments.userId, users.id))
      .leftJoin(
        completedAssignments,
        and(
          eq(assignments.id, completedAssignments.assignmentId),
          eq(completedAssignments.userId, userId)
        )
      )
      .orderBy(assignments.deadline);
    
    return unitAssignments;
  }
  
  async createAssignment(data: InsertAssignment & { userId: number }): Promise<any> {
    const [newAssignment] = await db
      .insert(assignments)
      .values({
        title: data.title,
        description: data.description,
        deadline: new Date(data.deadline),
        fileUrl: data.fileUrl,
        unitCode: data.unitCode,
        userId: data.userId
      })
      .returning();
    
    const [uploader] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, data.userId));
    
    return {
      ...newAssignment,
      uploadedBy: uploader.name,
      completed: false
    };
  }
  
  async deleteAssignment(assignmentId: number, userId: number): Promise<any | null> {
    // First verify that the assignment exists and belongs to the user
    const [assignment] = await db
      .select()
      .from(assignments)
      .where(
        and(
          eq(assignments.id, assignmentId),
          eq(assignments.userId, userId)
        )
      );
    
    if (!assignment) {
      return null; // Assignment not found or doesn't belong to the user
    }
    
    // Delete associated completions
    await db
      .delete(completedAssignments)
      .where(eq(completedAssignments.assignmentId, assignmentId));
    
    // Delete the assignment
    const [deletedAssignment] = await db
      .delete(assignments)
      .where(eq(assignments.id, assignmentId))
      .returning();
    
    return deletedAssignment;
  }
  
  async completeAssignment(assignmentId: number, userId: number): Promise<any> {
    // Check if already completed
    const [existingCompletion] = await db
      .select()
      .from(completedAssignments)
      .where(
        and(
          eq(completedAssignments.assignmentId, assignmentId),
          eq(completedAssignments.userId, userId)
        )
      );
    
    if (existingCompletion) {
      return { alreadyCompleted: true };
    }
    
    const completedAt = new Date();
    const [completion] = await db
      .insert(completedAssignments)
      .values({
        assignmentId,
        userId,
        completedAt
      })
      .returning();
    
    const [assignment] = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, assignmentId));
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    // Update user rank based on completion time
    await this.updateUserRank(userId);
    
    return {
      ...completion,
      assignment,
      user
    };
  }
  
  private async updateUserRank(userId: number): Promise<void> {
    // Calculate and update user's rank based on assignment completion times
    // This would update the user's rank in the database
  }
  
  // Past papers methods
  async getPastPapersByUnit(unitCode: string, userId: number): Promise<any[]> {
    const unitPapers = await db
      .select({
        id: pastPapers.id,
        title: pastPapers.title,
        description: pastPapers.description,
        year: pastPapers.year,
        fileUrl: pastPapers.fileUrl,
        unitCode: pastPapers.unitCode,
        createdAt: pastPapers.createdAt,
        uploadedBy: users.name,
        uploaderImageUrl: users.profileImageUrl,
        viewed: sql<boolean>`CASE WHEN ${userPaperViews.id} IS NOT NULL THEN TRUE ELSE FALSE END`.as('viewed')
      })
      .from(pastPapers)
      .where(eq(pastPapers.unitCode, unitCode))
      .innerJoin(users, eq(pastPapers.userId, users.id))
      .leftJoin(
        userPaperViews,
        and(
          eq(pastPapers.id, userPaperViews.paperId),
          eq(userPaperViews.userId, userId)
        )
      )
      .orderBy(desc(pastPapers.year), desc(pastPapers.createdAt));
    
    return unitPapers;
  }
  
  async createPastPaper(data: InsertPastPaper & { userId: number }): Promise<any> {
    const [newPaper] = await db
      .insert(pastPapers)
      .values({
        title: data.title,
        description: data.description,
        year: data.year,
        fileUrl: data.fileUrl,
        unitCode: data.unitCode,
        userId: data.userId
      })
      .returning();
    
    const [uploader] = await db
      .select({ name: users.name, profileImageUrl: users.profileImageUrl })
      .from(users)
      .where(eq(users.id, data.userId));
    
    return {
      ...newPaper,
      uploadedBy: uploader.name,
      uploaderImageUrl: uploader.profileImageUrl,
      viewed: false
    };
  }
  
  async deletePastPaper(paperId: number, userId: number): Promise<any | null> {
    // First verify that the paper exists and belongs to the user
    const [paper] = await db
      .select()
      .from(pastPapers)
      .where(
        and(
          eq(pastPapers.id, paperId),
          eq(pastPapers.userId, userId)
        )
      );
    
    if (!paper) {
      return null; // Paper not found or doesn't belong to the user
    }
    
    // Delete associated views
    await db
      .delete(userPaperViews)
      .where(eq(userPaperViews.paperId, paperId));
    
    // Delete the paper
    const [deletedPaper] = await db
      .delete(pastPapers)
      .where(eq(pastPapers.id, paperId))
      .returning();
    
    return deletedPaper;
  }

  async markPastPaperAsViewed(paperId: number, userId: number): Promise<void> {
    // Check if already viewed
    const [existingView] = await db
      .select()
      .from(userPaperViews)
      .where(
        and(
          eq(userPaperViews.paperId, paperId),
          eq(userPaperViews.userId, userId)
        )
      );
    
    if (!existingView) {
      await db
        .insert(userPaperViews)
        .values({
          paperId,
          userId,
          viewedAt: new Date()
        });
    }
  }
  
  // Ranking methods
  async getUnitRankings(unitCode: string): Promise<any[]> {
    // Get all assignments for the unit
    const unitAssignments = await db
      .select()
      .from(assignments)
      .where(eq(assignments.unitCode, unitCode));
    
    if (unitAssignments.length === 0) {
      return [];
    }
    
    // Get all users who completed assignments in this unit
    const userCompletions = await db
      .select({
        userId: completedAssignments.userId,
        name: users.name,
        profileImageUrl: users.profileImageUrl,
        assignmentId: completedAssignments.assignmentId,
        completedAt: completedAssignments.completedAt
      })
      .from(completedAssignments)
      .innerJoin(users, eq(completedAssignments.userId, users.id))
      .innerJoin(assignments, eq(completedAssignments.assignmentId, assignments.id))
      .where(eq(assignments.unitCode, unitCode));
    
    // Group completions by user
    const userCompletionMap = new Map<number, {
      userId: number;
      name: string;
      profileImageUrl: string | null;
      completions: Array<{
        assignmentId: number;
        completedAt: Date;
        createdAt: Date;
        title: string;
        completionTime: string;
      }>;
    }>();
    
    // Add assignment data to completions
    for (const completion of userCompletions) {
      const assignment = unitAssignments.find(a => a.id === completion.assignmentId);
      if (!assignment) continue;
      
      const completionTime = formatDistance(
        new Date(completion.completedAt),
        new Date(assignment.createdAt)
      );
      
      if (!userCompletionMap.has(completion.userId)) {
        userCompletionMap.set(completion.userId, {
          userId: completion.userId,
          name: completion.name,
          profileImageUrl: completion.profileImageUrl,
          completions: []
        });
      }
      
      const userData = userCompletionMap.get(completion.userId)!;
      userData.completions.push({
        assignmentId: completion.assignmentId,
        completedAt: completion.completedAt,
        createdAt: assignment.createdAt,
        title: assignment.title,
        completionTime
      });
    }
    
    // Calculate average completion time for each user
    const rankings: Array<{
      userId: number;
      name: string;
      profileImageUrl: string | null;
      completedAssignments: number;
      averageCompletionTime: string;
      totalMilliseconds: number;
      recentCompletions: Array<any>;
      position: number;
      overallRank: number;
    }> = [];
    
    userCompletionMap.forEach((userData) => {
      const totalTimeMs = userData.completions.reduce((sum, completion) => {
        return sum + (new Date(completion.completedAt).getTime() - new Date(completion.createdAt).getTime());
      }, 0);
      
      const avgTimeMs = userData.completions.length > 0 ? totalTimeMs / userData.completions.length : 0;
      
      rankings.push({
        userId: userData.userId,
        name: userData.name,
        profileImageUrl: userData.profileImageUrl,
        completedAssignments: userData.completions.length,
        averageCompletionTime: formatDistance(new Date(0), new Date(avgTimeMs)),
        totalMilliseconds: avgTimeMs,
        recentCompletions: userData.completions
          .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
          .slice(0, 3),
        position: 0, // Will be set after sorting
        overallRank: 0 // Will be set after sorting
      });
    });
    
    // Sort rankings by average completion time
    rankings.sort((a, b) => a.totalMilliseconds - b.totalMilliseconds);
    
    // Assign positions
    rankings.forEach((ranking, index) => {
      ranking.position = index + 1;
      
      // Temporarily set overall rank to position (would be calculated more accurately in a real app)
      ranking.overallRank = ranking.position;
    });
    
    return rankings;
  }
}

export const storage = new DatabaseStorage();
