import { db } from "./db";
import { users, units, notes, assignments, pastPapers, completedAssignments, userNoteViews, userPaperViews } from "../shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Same password hashing function from auth.ts
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Function to reset and recreate the database with the new data
async function resetData() {
  console.log("Starting database reset...");

  try {
    // 1. Delete all existing records
    console.log("Deleting existing records...");
    await db.delete(userPaperViews);
    await db.delete(userNoteViews);
    await db.delete(completedAssignments);
    await db.delete(pastPapers);
    await db.delete(assignments);
    await db.delete(notes);
    await db.delete(users);
    await db.delete(units);

    // 2. Insert new units
    console.log("Inserting new units...");
    const unitsData = [
      { unitCode: "MAT 2101", name: "Integral Calculus", description: "Introduction to integration techniques and applications", category: "Mathematics" },
      { unitCode: "MAT 2102", name: "Real Analysis", description: "Rigorous treatment of continuity, differentiability, and integration", category: "Mathematics" },
      { unitCode: "STA 2101", name: "Probability Theory", description: "Foundational concepts in probability theory and distributions", category: "Statistics" },
      { unitCode: "DAT 2101", name: "Algorithms and Data Structures", description: "Design and analysis of efficient algorithms and data structures", category: "Computing" },
      { unitCode: "DAT 2102", name: "Information Security, Governance and the Cloud", description: "Security principles, governance frameworks, and cloud technologies", category: "Computing" },
      { unitCode: "HED 2101", name: "Principles of Ethics", description: "Fundamentals of ethical reasoning and professional conduct", category: "Humanities" }
    ];

    await db.insert(units).values(unitsData);

    // 3. Insert teacher account
    console.log("Creating teacher account...");
    const hashedPassword = await hashPassword("sds#website");
    
    const teacherData = {
      name: "Teacher",
      admissionNumber: "000000",
      password: hashedPassword,
      profileImageUrl: null,
      role: "teacher"
    };
    
    await db.insert(users).values(teacherData);

    // 4. Insert student accounts
    console.log("Creating student accounts...");
    const studentsData = [
      { name: "Samsam Abdul Nassir", admissionNumber: "163336" },
      { name: "Alvin Lemayian", admissionNumber: "170743" },
      { name: "Angel", admissionNumber: "171723" },
      { name: "Esther Rabera", admissionNumber: "176584" },
      { name: "Lina Moraa", admissionNumber: "176834" },
      { name: "Sumaya Ismail", admissionNumber: "177341" },
      { name: "Elvis Macharia", admissionNumber: "178916" },
      { name: "Andres Ngotho", admissionNumber: "179087" },
      { name: "Wendy Wanjiru", admissionNumber: "179514" },
      { name: "Kiptoo", admissionNumber: "180657" },
      { name: "Alfred Mulinge", admissionNumber: "180963" },
      { name: "Sylvia Waithira", admissionNumber: "181038" },
      { name: "Cyril Wafula", admissionNumber: "182121" },
      { name: "Faith Jaher", admissionNumber: "182608" },
      { name: "Alfred Mwaengo", admissionNumber: "183923" },
      { name: "Victoria Mutheu", admissionNumber: "184087" },
      { name: "Effie Nelima", admissionNumber: "186768" },
      { name: "Edwin Karanu", admissionNumber: "187500" },
      { name: "Kristina Nasieku", admissionNumber: "188145" },
      { name: "Mukisa Ramogi", admissionNumber: "188454" },
      { name: "Francis Mburu", admissionNumber: "189104" },
      { name: "Irene Vaati", admissionNumber: "189040" },
      { name: "Griffin Che", admissionNumber: "189228" },
      { name: "Justin Gitari", admissionNumber: "189229" },
      { name: "Ian Muchai", admissionNumber: "189612" },
      { name: "Mary Mukami", admissionNumber: "189457" },
      { name: "Brandon Mecker", admissionNumber: "189305" },
      { name: "Wenwah Hawala", admissionNumber: "189778" },
      { name: "Angela Nyawira", admissionNumber: "190037" },
      { name: "Janice Muthoki", admissionNumber: "190069" },
      { name: "Paul Ngugi", admissionNumber: "190093" },
      { name: "Floyd Leone Milla", admissionNumber: "190095" },
      { name: "Jury Makori", admissionNumber: "190117" },
      { name: "Samuel Libuko", admissionNumber: "190325" },
      { name: "Griffins D. Ambundo", admissionNumber: "190236" },
      { name: "Cynthia Musangi", admissionNumber: "190362" },
      { name: "Brianna Mwende", admissionNumber: "190457" },
      { name: "Aron", admissionNumber: "190862" },
      { name: "Tristar Gathigia", admissionNumber: "190848" },
      { name: "Natasha Wangare", admissionNumber: "191262" },
      { name: "Patrick", admissionNumber: "191894" },
      { name: "Khadija Mustafa", admissionNumber: "191878" },
      { name: "Justus Erick", admissionNumber: "191948" },
      { name: "Jane Waithira", admissionNumber: "191956" },
      { name: "Ruphas Minyalwa", admissionNumber: "192127" },
      { name: "Ian Paul", admissionNumber: "192869" },
      { name: "Ngnintedem Demanou", admissionNumber: "192973" },
      { name: "Joy Watiri", admissionNumber: "193631" }
    ];

    // Insert all students with the same default password
    for (const student of studentsData) {
      await db.insert(users).values({
        ...student,
        password: hashedPassword,
        profileImageUrl: null,
        role: "student"
      });
    }

    console.log("Database reset completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error resetting database:", error);
    process.exit(1);
  }
}

resetData();