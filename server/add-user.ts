import { db } from "./db";
import { users } from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function addUser() {
  console.log("Adding user Alfred Mulinge...");
  
  // Check if user already exists
  const existingUser = await db.select()
    .from(users)
    .where(eq(users.name, "Alfred Mulinge"));

  if (existingUser.length > 0) {
    console.log("User Alfred Mulinge already exists");
    return;
  }
  
  // Create password
  const password = await hashPassword("sds#website");
  
  // Add user
  await db.insert(users).values({
    name: "Alfred Mulinge",
    admissionNumber: "180963",
    password,
    profileImageUrl: null,
    rank: 4
  });
  
  console.log("User Alfred Mulinge added successfully!");
}

// Run the function
addUser().catch(console.error);