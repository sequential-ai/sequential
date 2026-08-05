const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: "postgres://postgres:postgres@localhost:5432/sequential_db" });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function test() {
  console.log("Keys on prisma:", Object.keys(prisma).filter(k => !k.startsWith('_')));
  console.log("taskEvidence exists:", !!prisma.taskEvidence);
  process.exit(0);
}

test();

test();
