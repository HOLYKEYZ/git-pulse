import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  return new PrismaClient();
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
prisma.$use(async (params, next) => {
  if (params.model === 'User' && params.action === 'findUnique') {
    params.where = { ...params.where, username: { equals: params.where.username } };
  }
  return next(params);
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
