import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// WebSocket transport for Node.js (native WebSocket not available in Node < 22)
neonConfig.webSocketConstructor = ws;
// Cache the WebSocket connection across queries in the same lambda invocation
neonConfig.fetchConnectionCache = true;

const connectionString = process.env.DATABASE_URL;
const adapter = connectionString
  ? new PrismaNeon({ connectionString })
  : undefined;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(adapter && { adapter }),
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

// Cache in all environments so warm serverless invocations reuse the client
// (previously only cached in dev, causing a new client per cold start in prod)
globalForPrisma.prisma = prisma;
