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
import fs from 'fs';
import path from 'path';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function runMigrations(client: postgres.Sql) {
  const migrationsDir = path.join(process.cwd(), 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    try {
      await client.unsafe(sql);
      log(`Applied migration: ${file}`, "db-init");
    } catch (error) {
      log(`Error applying migration ${file}: ${(error as Error).message}`, "db-init");
      throw error;
    }
  }
}

export async function initializeDatabase() {
  log("Initializing database...", "db-init");
  
  // Create a separate connection for database initialization
  const connectionString = process.env.DATABASE_URL!;
  const client = postgres(connectionString);
  const db = drizzle(client, {});
  
  try {
    // Run migrations
    await runMigrations(client);
    
    // Check if we need to seed any data
    const [existingUnits] = await db.select().from(units).limit(1);
    if (!existingUnits) {
      log("No units found, seeding sample data...", "db-init");
      
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
    }
    
    log("Database initialization complete", "db-init");
  } catch (error) {
    log(`Database initialization error: ${(error as Error).message}`, "db-init");
    throw error;
  } finally {
    // Close the client
    await client.end();
  }
}