import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Set the webSocketConstructor for Neon and Node.js
neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const getConnectionString = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // If running in development, we can try to fall back or at least provide a clear error
    if (process.env.NODE_ENV === "development") {
      console.error("❌ DATABASE_URL is not defined in environment variables.");
    }
    return "";
  }
  return url;
};

const createPrismaClient = () => {
  const connectionString = getConnectionString();
  
  if (!connectionString) {
    // Fallback to a dummy client or throw a more descriptive error
    // Throwing here will be caught by Next.js and shown in the overlay
    throw new Error("Missing DATABASE_URL environment variable. Please check your .env.local file.");
  }

  const pool = new Pool({ connectionString });
  
  // @ts-expect-error - Mismatched versions of @neondatabase/serverless types between the adapter and the app
  const adapter = new PrismaNeon(pool);
  
  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
