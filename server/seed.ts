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

export async function seed() {
  console.log("Starting seed process...");
  
  // Check if users already exist
  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) {
    // Check if Alfred Mulinge exists
    const alfredExists = existingUsers.some(u => 
      u.name.toLowerCase() === "alfred mulinge" && 
      u.admissionNumber === "180963"
    );
    
    if (!alfredExists) {
      console.log("Adding missing users...");
      const defaultPassword = await hashPassword("sds#website");
      
      // Add Alfred Mulinge and other missing users
      await db.insert(users).values([
        {
          name: "Alfred Mulinge",
          admissionNumber: "180963",
          password: defaultPassword,
          profileImageUrl: null,
          rank: 4,
          role: "student"
        },
        {
          name: "Victoria Mutheu",
          admissionNumber: "184087",
          password: defaultPassword,
          profileImageUrl: null,
          rank: 5,
          role: "student"
        }
      ]).catch(err => {
        console.error("Error adding missing users:", err.message);
      });
    }
    
    console.log("Users already exist, skipping full user seed");
  } else {
    console.log("Seeding users...");
    // Create default password for all users
    const defaultPassword = await hashPassword("sds#website");
    
    // Create users
    await db.insert(users).values([
      {
        name: "Samsam Abdul Nassir",
        admissionNumber: "163336",
        password: defaultPassword,
        profileImageUrl: null,
        rank: 1,
        role: "student"
      },
      {
        name: "Teacher Account",
        admissionNumber: "TEACHER001",
        password: defaultPassword,
        profileImageUrl: null,
        rank: null,
        role: "teacher"
      },
      {
        name: "John Doe",
        admissionNumber: "SDS001",
        password: defaultPassword,
        profileImageUrl: null,
        rank: 2,
        role: "student"
      },
      {
        name: "Jane Smith",
        admissionNumber: "SDS002",
        password: defaultPassword,
        profileImageUrl: null,
        rank: 3,
        role: "student"
      },
      {
        name: "Alfred Mulinge",
        admissionNumber: "180963",
        password: defaultPassword,
        profileImageUrl: null,
        rank: 4,
        role: "student"
      },
      {
        name: "Victoria Mutheu", 
        admissionNumber: "184087",
        password: defaultPassword,
        profileImageUrl: null,
        rank: 5,
        role: "student"
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