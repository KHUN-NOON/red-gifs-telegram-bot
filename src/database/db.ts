// src/lib/db.ts
import { PrismaPg } from "@prisma/adapter-pg"; // Use the adapter for your DB (e.g., pg, mysql2)
import pg from "pg";
import { PrismaClient } from "../generated/prisma/client.ts";

// Initialize your database driver pool
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// Instantiate and export the custom client
export const prisma = new PrismaClient({ adapter });
