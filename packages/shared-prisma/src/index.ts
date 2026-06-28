import { PrismaClient, Prisma, Role } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function connectPrisma() {
  try {
    await prisma.$connect();
    console.log('[Prisma] Connected to database');
  } catch (err) {
    console.error('[Prisma] Connection failed:', (err as Error).message);
    throw err;
  }
}

export async function disconnectPrisma() {
  try {
    await prisma.$disconnect();
    console.log('[Prisma] Disconnected from database');
  } catch {
    // Ignore disconnect errors during shutdown
  }
}

export { PrismaClient, Prisma };
export { Role };
export type {
  User,
  Payment,
  Invoice,
  Receipt,
  Notification,
  ActivityLog,
  AnalyticsEvent,
  AuditLog,
  ErrorLog,
  Incident,
  PaymentLedger,
} from '@prisma/client';
