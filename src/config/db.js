const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

// Prisma 7 requires an explicit driver adapter instead of reading
// DATABASE_URL directly inside PrismaClient.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Singleton so we don't spawn a new connection pool on every import
const prisma = new PrismaClient({ adapter });

module.exports = prisma;