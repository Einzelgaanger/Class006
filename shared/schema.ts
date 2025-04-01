import { pgTable, text, serial, integer, boolean, timestamp, uniqueIndex, unique, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  admissionNumber: text("admission_number").notNull().unique(),
  password: text("password").notNull(),
  profileImageUrl: text("profile_image_url"),
  rank: integer("rank"),
  role: text("role").default("student"),
});

// Units Table
export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  unitCode: text("unit_code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // Mathematics, Statistics, Data Science, Humanities, etc.
});

// Notes Table
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  fileUrl: text("file_url"),
  unitCode: text("unit_code").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Assignments Table
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  deadline: timestamp("deadline").notNull(),
  fileUrl: text("file_url"),
  unitCode: text("unit_code").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Past Papers Table
export const pastPapers = pgTable("past_papers", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  year: text("year").notNull(),
  fileUrl: text("file_url"),
  unitCode: text("unit_code").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Completed Assignments Table
export const completedAssignments = pgTable("completed_assignments", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull().references(() => assignments.id),
  userId: integer("user_id").notNull().references(() => users.id),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

// User Note Views Table
export const userNoteViews = pgTable("user_note_views", {
  id: serial("id").primaryKey(),
  noteId: integer("note_id").notNull().references(() => notes.id),
  userId: integer("user_id").notNull().references(() => users.id),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
}, (table) => ({
  uniqueView: uniqueIndex("unique_note_view").on(table.noteId, table.userId),
}));

// User Paper Views Table
export const userPaperViews = pgTable("user_paper_views", {
  id: serial("id").primaryKey(),
  paperId: integer("paper_id").notNull().references(() => pastPapers.id),
  userId: integer("user_id").notNull().references(() => users.id),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
}, (table) => ({
  uniqueView: uniqueIndex("unique_paper_view").on(table.paperId, table.userId),
}));

// Types
export type User = typeof users.$inferSelect;
export type Unit = typeof units.$inferSelect;
export type Note = typeof notes.$inferSelect & {
  uploadedBy: string;
  uploaderImageUrl?: string;
  viewed: boolean;
};
export type Assignment = typeof assignments.$inferSelect & {
  uploadedBy: string;
  completed: boolean;
  completedAt?: Date;
};
export type PastPaper = typeof pastPapers.$inferSelect & {
  uploadedBy: string;
  uploaderImageUrl?: string;
  viewed: boolean;
};
export type CompletedAssignment = typeof completedAssignments.$inferSelect;
export type UserNoteView = typeof userNoteViews.$inferSelect;
export type UserPaperView = typeof userPaperViews.$inferSelect;

// Insert Types
export type InsertUser = typeof users.$inferInsert;
export type InsertUnit = typeof units.$inferInsert;
export type InsertNote = typeof notes.$inferInsert;
export type InsertAssignment = typeof assignments.$inferInsert;
export type InsertPastPaper = typeof pastPapers.$inferInsert;
export type InsertCompletedAssignment = typeof completedAssignments.$inferInsert;
export type InsertUserNoteView = typeof userNoteViews.$inferInsert;
export type InsertUserPaperView = typeof userPaperViews.$inferInsert;

// Zod Schemas
export const insertUserSchema = createInsertSchema(users);
export const insertUnitSchema = createInsertSchema(units);
export const insertNoteSchema = createInsertSchema(notes);
export const insertAssignmentSchema = createInsertSchema(assignments);
export const insertPastPaperSchema = createInsertSchema(pastPapers);
export const insertCompletedAssignmentSchema = createInsertSchema(completedAssignments);
export const insertUserNoteViewSchema = createInsertSchema(userNoteViews);
export const insertUserPaperViewSchema = createInsertSchema(userPaperViews);

// Zod Schemas
export const loginSchema = z.object({
  name: z.string().min(1, "Name is required"),
  admissionNumber: z.string().min(1, "Admission number is required"),
  password: z.string().min(1, "Password is required"),
});

export const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export const forgotPasswordSchema = z.object({
  name: z.string().min(1, "Name is required"),
  admissionNumber: z.string().min(1, "Admission number is required"),
  secretKey: z.string().min(1, "Secret key is required"),
});

export const insertNoteSchema = createInsertSchema(notes).pick({
  title: true,
  description: true,
  unitCode: true,
}).extend({
  fileUrl: z.string().nullable().optional(),
});

export const insertAssignmentSchema = createInsertSchema(assignments).pick({
  title: true,
  description: true,
  deadline: true,
  unitCode: true,
}).extend({
  fileUrl: z.string().nullable().optional(),
});

export const insertPastPaperSchema = createInsertSchema(pastPapers).pick({
  title: true,
  description: true,
  year: true,
  unitCode: true,
}).extend({
  fileUrl: z.string().nullable().optional(),
});

export const insertCompletedAssignmentSchema = createInsertSchema(completedAssignments).pick({
  assignmentId: true,
  userId: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type PasswordUpdateData = z.infer<typeof passwordUpdateSchema>;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type InsertPastPaper = z.infer<typeof insertPastPaperSchema>;
export type InsertCompletedAssignment = z.infer<typeof insertCompletedAssignmentSchema>;

export type Activity = {
  id: number;
  type: 'assignment' | 'note' | 'pastpaper' | 'rank';
  title: string;
  unitCode: string;
  timestamp: Date;
};

export type Ranking = {
  userId: number;
  name: string;
  profileImageUrl: string | null;
  position: number;
  completedAssignments: number;
  averageCompletionTime: string;
  recentCompletions: Array<{
    assignmentId: number;
    completedAt: Date;
    title: string;
    completionTime: string;
  }>;
  overallRank: number;
};
