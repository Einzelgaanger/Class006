import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

// Enhanced database connection with better error handling
// and compatibility with Render.com and other cloud providers
const connectionString = process.env.DATABASE_URL!;

// Add sslmode=require if not already present in the connection string
// This is the most compatible way to ensure SSL is used across different environments
let enhancedConnectionString = connectionString;
if (!connectionString.includes('sslmode=')) {
  enhancedConnectionString = connectionString.includes('?') 
    ? `${connectionString}&sslmode=require` 
    : `${connectionString}?sslmode=require`;
}

// Log connection attempt with masked credentials
const maskedUrl = enhancedConnectionString.replace(/:[^:@]+@/, ':****@');
console.log(`Connecting to database: ${maskedUrl.split('@')[1] || 'local'}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

// Create client with a simpler configuration that works on most cloud providers
const client = postgres(enhancedConnectionString, {
  max: 10,
  idle_timeout: 30,
  connect_timeout: 30,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(client, { schema });
