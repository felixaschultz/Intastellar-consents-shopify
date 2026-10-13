import { PrismaClient } from "@prisma/client";

declare global {
  var prismaGlobal: PrismaClient;
}

// Always cache on `global`, including in production: Vercel reuses warm
// serverless containers across invocations, and without this a PrismaClient
// (and its own small connection pool) could end up re-created per request
// instead of being reused, needlessly multiplying connections against the
// database's pool.
if (!global.prismaGlobal) {
  global.prismaGlobal = new PrismaClient();
}

const prisma = global.prismaGlobal;

export default prisma;
