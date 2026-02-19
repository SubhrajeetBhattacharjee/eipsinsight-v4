// lib/prisma.ts
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@/env";

// Production (Vercel/Railway etc): paste CA cert in DATABASE_CA_CERT env var.
// We write it to a temp file so NODE_EXTRA_CA_CERTS can use it.
if (process.env.DATABASE_CA_CERT && !process.env.NODE_EXTRA_CA_CERTS) {
  const certPath = path.join(os.tmpdir(), "aiven-ca.pem");
  fs.writeFileSync(certPath, process.env.DATABASE_CA_CERT);
  process.env.NODE_EXTRA_CA_CERTS = certPath;
}

// Cache BOTH Pool and PrismaClient in globalThis to prevent
// connection leaks during Next.js hot-reloads in development.
// Without this, every HMR creates a new Pool (up to `max` connections),
// quickly exhausting the database's connection limit (error 53300).
const globalForPrisma = globalThis as unknown as {
  pool?: Pool;
  prisma?: PrismaClient;
};

const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    max: 3, // Aiven hobby tier ~20 slots; keep very low to avoid 53300
    min: 0, // Don't hold idle connections
    idleTimeoutMillis: 20000, // Release idle connections sooner
    connectionTimeoutMillis: 10000,
    statement_timeout: 30000,
    query_timeout: 30000,
    allowExitOnIdle: true, // Release pool when no active queries
  });

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["error"],
  });

// Cache in both dev and production to avoid creating new pools per request/worker
globalForPrisma.pool = pool;
globalForPrisma.prisma = prisma;
