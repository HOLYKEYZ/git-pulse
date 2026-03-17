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

const createPrismaClient = () => {
  // ⚡ CRITICAL FIX: Next.js Turbopack proxies process.env. We MUST force it to a primitive string.
  const connectionString = `${process.env.DATABASE_URL}`;
  
  if (!process.env.DATABASE_URL) {
    throw new Error("❌ DATABASE_URL is missing from process.env. Please check your environment configuration.");
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
