import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Set the webSocketConstructor for Neon and Node.js
if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// console.log("🔥 [Prisma Module Loaded] globalForPrisma.prisma exists?", !!globalForPrisma.prisma);
console.log("💎 [Prisma Module Audit] DATABASE_URL Key Found?", !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
  console.log("💎 [Prisma Module Audit] DATABASE_URL Length:", process.env.DATABASE_URL.length);
}

const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;

  console.log("🛠️ [Prisma] Initializing with URL length:", connectionString?.length);
  
  if (!connectionString) {
    throw new Error("❌ DATABASE_URL is missing from process.env. Please check your environment configuration.");
  }

  // 🛡️ [Backend Fortress] Reverting to direct string parsing to test driver-level resilience
  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);
  
  console.log("🛠️ [Prisma] Client and Adapter created.");
  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
