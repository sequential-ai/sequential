# Prisma & PostgreSQL Guide

This guide explains how Prisma connects to your local Docker PostgreSQL database and provides examples of how to query your database using the Prisma Client.

## 1. How Prisma Connects to PostgreSQL

### The Flow
1. **Docker Engine**: You run PostgreSQL inside a Docker container (via `docker-compose.yml`). It exposes port `5432` to your computer.
2. **Environment File (`.env`)**: You store the connection string for this database. 
   ```env
   DATABASE_URL="postgresql://root:password@localhost:5432/sequential_db?schema=public"
   ```
3. **Prisma Config**: Prisma Version 7 reads this connection string using `prisma.config.ts`.
4. **Prisma Schema (`schema.prisma`)**: This file defines the *shape* of your database (Models, Roles, Enums).
5. **Prisma Client**: Prisma generates strict TypeScript/JavaScript methods based on your schema so you can interact with the database natively in code.

---

## 2. Prisma CLI Commands

These are the most common terminal commands you'll use. *Run these inside the `server/` directory.*

- **View Data**: 
  ```bash
  npx prisma studio
  ```
  *Starts a local GUI (usually at `http://localhost:5555`) to view and edit database rows visually.*

- **Sync Schema (Prototyping)**: 
  ```bash
  npx prisma db push
  ```
  *Instantly forces the database to match your `schema.prisma`. (Warning: may cause data loss if you make destructive changes like dropping tables).*

- **Create Migration (Production-Safe)**:
  ```bash
  npx prisma migrate dev --name <descriptive_name>
  ```
  *Safely creates SQL migration files that apply changes incrementally without losing data.*

---

## 3. How to Use Prisma in JavaScript

Before querying the database, you need to import and instantiate the Prisma Client.

### Setup (`server/src/db.js` or similar)
```javascript
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma
const prisma = new PrismaClient();

module.exports = prisma;
```

### Common Queries

**1. Create a New User**
```javascript
const newUser = await prisma.user.create({
  data: {
    clerkUserId: 'user_2m...',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    systemRole: 'ADMIN'
  }
});
```

**2. Create a User and Organization Together (Relational)**
```javascript
const org = await prisma.organization.create({
  data: {
    clerkOrgId: 'org_123...',
    name: 'Acme Corp',
    members: {
      create: {
        userId: newUser.id, // Linking the user we just made
        role: 'OWNER'
      }
    }
  }
});
```

**3. Fetch All Tasks for an Organization**
```javascript
const tasks = await prisma.task.findMany({
  where: {
    organizationId: 'org-uuid-here',
    status: 'COMPLETED'
  },
  orderBy: {
    createdAt: 'desc' // Newest first
  }
});
```

**4. Update a Record**
```javascript
const updatedTask = await prisma.task.update({
  where: { id: 'task-uuid-here' },
  data: { status: 'RUNNING' }
});
```

**5. Delete a Record (Soft Delete Strategy)**
*Since we added `deletedAt` in the schema, we prefer updating rather than actually deleting.*
```javascript
const deletedKey = await prisma.apiKey.update({
  where: { id: 'key-uuid-here' },
  data: { deletedAt: new Date() } // Soft delete
});
```

> [!TIP]
> Need to autocomplete your database queries? If you are using VS Code or Cursor, the Prisma extension will automatically suggest fields as you type `prisma.organization.findUnique(...)` based on your schema!
