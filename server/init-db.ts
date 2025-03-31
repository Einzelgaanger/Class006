import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { 
  users, 
  units,
  notes,
  assignments,
  pastPapers,
  completedAssignments,
  userNoteViews,
  userPaperViews
} from "../shared/schema";
import { log } from "./vite";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function initializeDatabase() {
  log("Initializing database...", "db-init");
  
  // Create a separate connection for database initialization
  const connectionString = process.env.DATABASE_URL!;
  const client = postgres(connectionString);
  const db = drizzle(client, {});
  
  try {
    // Check if the users table exists
    try {
      await db.select().from(users).limit(1);
      log("Database tables already exist", "db-init");
    } catch (error) {
      // If we get an error, the tables don't exist yet
      log("Creating database tables...", "db-init");
      
      // Create tables one by one
      const createTable = async (tableName: string, query: string) => {
        try {
          await client.unsafe(query);
          log(`Created table: ${tableName}`, "db-init");
        } catch (err) {
          log(`Error creating table ${tableName}: ${(err as Error).message}`, "db-init");
        }
      };
      
      // Create users table
      await createTable("users", `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          admission_number TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          profile_image_url TEXT,
          rank INTEGER,
          role TEXT DEFAULT 'student'
        )
      `);
      
      // Create units table
      await createTable("units", `
        CREATE TABLE IF NOT EXISTS units (
          id SERIAL PRIMARY KEY,
          unit_code TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          description TEXT,
          category TEXT
        )
      `);
      
      // Create notes table
      await createTable("notes", `
        CREATE TABLE IF NOT EXISTS notes (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          file_url TEXT,
          unit_code TEXT NOT NULL,
          user_id INTEGER NOT NULL REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )
      `);
      
      // Create assignments table
      await createTable("assignments", `
        CREATE TABLE IF NOT EXISTS assignments (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          file_url TEXT,
          unit_code TEXT NOT NULL,
          user_id INTEGER NOT NULL REFERENCES users(id),
          deadline TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )
      `);
      
      // Create past_papers table
      await createTable("past_papers", `
        CREATE TABLE IF NOT EXISTS past_papers (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          year TEXT NOT NULL,
          file_url TEXT,
          unit_code TEXT NOT NULL,
          user_id INTEGER NOT NULL REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )
      `);
      
      // Create completed_assignments table
      await createTable("completed_assignments", `
        CREATE TABLE IF NOT EXISTS completed_assignments (
          id SERIAL PRIMARY KEY,
          assignment_id INTEGER NOT NULL REFERENCES assignments(id),
          user_id INTEGER NOT NULL REFERENCES users(id),
          completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )
      `);
      
      // Create user_note_views table
      await createTable("user_note_views", `
        CREATE TABLE IF NOT EXISTS user_note_views (
          id SERIAL PRIMARY KEY,
          note_id INTEGER NOT NULL REFERENCES notes(id),
          user_id INTEGER NOT NULL REFERENCES users(id),
          viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          UNIQUE(note_id, user_id)
        )
      `);
      
      // Create user_paper_views table
      await createTable("user_paper_views", `
        CREATE TABLE IF NOT EXISTS user_paper_views (
          id SERIAL PRIMARY KEY,
          paper_id INTEGER NOT NULL REFERENCES past_papers(id),
          user_id INTEGER NOT NULL REFERENCES users(id),
          viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          UNIQUE(paper_id, user_id)
        )
      `);
      
      // Create session table
      await createTable("session", `
        CREATE TABLE IF NOT EXISTS "session" (
          "sid" varchar NOT NULL PRIMARY KEY,
          "sess" json NOT NULL,
          "expire" timestamp(6) NOT NULL
        )
      `);
      
      // Add sample units
      await db.insert(units).values([
        {
          unitCode: "MAT 2101",
          name: "Integral Calculus",
          description: "Advanced integration techniques and applications",
          category: "Mathematics"
        },
        {
          unitCode: "MAT 2102",
          name: "Real Analysis",
          description: "Rigorous treatment of real number system and functions",
          category: "Mathematics"
        },
        {
          unitCode: "STA 2101",
          name: "Probability Theory",
          description: "Fundamentals of probability and random variables",
          category: "Statistics"
        },
        {
          unitCode: "DAT 2101",
          name: "Algorithms and Data Structures",
          description: "Efficient algorithms and data organization",
          category: "Data Science"
        },
        {
          unitCode: "DAT 2102",
          name: "Information Security, Governance and the Cloud",
          description: "Information security in modern cloud environments",
          category: "Data Science"
        },
        {
          unitCode: "HED 2101",
          name: "Principles of Ethics",
          description: "Ethical frameworks and moral reasoning",
          category: "Humanities"
        }
      ]).catch(err => {
        log(`Error adding units: ${err.message}`, "db-init");
      });
      
      // Create sample users
      const hashedPassword = await hashPassword("sds#website");
      
      await db.insert(users).values([
        {
          name: "Samsam Abdul Nassir",
          admissionNumber: "163336",
          password: hashedPassword,
          profileImageUrl: null,
          rank: null,
          role: "student"
        },
        {
          name: "Teacher Account",
          admissionNumber: "TEACHER001",
          password: hashedPassword,
          profileImageUrl: null,
          rank: null,
          role: "teacher"
        }
      ]).catch(err => {
        log(`Error adding sample users: ${err.message}`, "db-init");
      });
      
      log("Database initialization complete", "db-init");
    }
  } catch (error) {
    log(`Database initialization error: ${(error as Error).message}`, "db-init");
  } finally {
    // Close the client
    await client.end();
  }
}