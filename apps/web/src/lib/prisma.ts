import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// console.log("🔥 [Prisma Module Loaded] globalForPrisma.prisma exists?", !!globalForPrisma.prisma);

const createPrismaClient = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("❌ DATABASE_URL is missing from process.env. Please check your environment configuration.");
  }

  // Returning standard Prisma client (runs in Node SSR, Edge adapter not needed here)
  return new PrismaClient();
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
