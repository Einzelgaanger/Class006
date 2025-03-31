import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

// More robust database connection with SSL and connection pool settings
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, {
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10, // Maximum number of connections in the pool
  idle_timeout: 30, // How long a connection can stay idle before being destroyed (seconds)
  connect_timeout: 30, // Connection timeout (seconds)
});

// Log connection attempt
console.log(`Connecting to database with environment: ${process.env.NODE_ENV}`);

export const db = drizzle(client, { schema });
