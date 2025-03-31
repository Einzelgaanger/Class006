import { db } from "./db";
import { users, units } from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
  console.log("Starting seed process...");
  
  // Check if users already exist
  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) {
    console.log("Users already exist, skipping user seed");
  } else {
    console.log("Seeding users...");
    // Create default password for all users
    const defaultPassword = await hashPassword("sds#website");
    
    // Create test users
    await db.insert(users).values([
      {
        name: "John Doe",
        admissionNumber: "SDS001",
        password: defaultPassword,
        profileImageUrl: null,
        rank: 1
      },
      {
        name: "Jane Smith",
        admissionNumber: "SDS002",
        password: defaultPassword,
        profileImageUrl: null,
        rank: 2
      },
      {
        name: "Bob Johnson",
        admissionNumber: "SDS003",
        password: defaultPassword,
        profileImageUrl: null,
        rank: 3
      }
    ]);
    console.log("Users seeded successfully!");
  }
  
  // Check if units already exist
  const existingUnits = await db.select().from(units);
  if (existingUnits.length > 0) {
    console.log("Units already exist, skipping unit seed");
  } else {
    console.log("Seeding units...");
    // Create course units
    await db.insert(units).values([
      {
        unitCode: "MAT2101",
        name: "Calculus",
        description: "Advanced calculus for SDS students",
        category: "Mathematics"
      },
      {
        unitCode: "MAT2102",
        name: "Linear Algebra",
        description: "Matrix operations and vector spaces",
        category: "Mathematics"
      },
      {
        unitCode: "STA2101",
        name: "Probability Theory",
        description: "Introduction to probability concepts",
        category: "Statistics"
      },
      {
        unitCode: "DAT2101",
        name: "Database Systems",
        description: "Relational database design and SQL",
        category: "Data Science"
      },
      {
        unitCode: "DAT2102",
        name: "Machine Learning Basics",
        description: "Introduction to ML algorithms",
        category: "Data Science"
      },
      {
        unitCode: "HED2101",
        name: "Communication Skills",
        description: "Effective communication for data scientists",
        category: "Humanities"
      }
    ]);
    console.log("Units seeded successfully!");
  }
  
  console.log("Seed process completed!");
}

// Run the seed function
seed().catch(console.error);