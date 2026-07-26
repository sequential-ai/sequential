const { PrismaClient } = require('@prisma/client');

// Initialize Prisma
const prisma = new PrismaClient();

module.exports = prisma;