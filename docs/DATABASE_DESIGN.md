# Database Design: Sequential AI

## 1. Overview
Sequential AI utilizes PostgreSQL as its primary datastore, managed and queried using **Prisma ORM**. The database is supplemented by the `pgvector` extension for vector similarity search (memory and embeddings). 

For local development, we use **Docker** to run PostgreSQL with `pgvector` pre-installed. The schema is designed for multi-tenancy (via `organizationId`), robust task tracking, and high-throughput logging of AI inferences.

### Key Technologies
- **PostgreSQL**: Primary relational database.
- **Prisma ORM**: Used for defining the schema (`schema.prisma`), running migrations, and type-safe database queries without raw SQL.
- **Docker**: Used to host the local database during development.
- **pgvector**: PostgreSQL extension for storing and querying high-dimensional vectors (embeddings).

## 2. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    Organization ||--o{ ApiKey : "owns"
    Organization ||--o{ Task : "creates"
    Organization ||--o{ Memory : "stores"
    Organization ||--o{ Interaction : "generates"
    
    Task ||--o{ TaskStep : "contains"
    Task ||--o{ Memory : "populates"
    Task ||--o{ Interaction : "tracks usage"

    Organization {
        String id PK "UUID"
        String clerkOrgId UK
        String name
        DateTime createdAt
        DateTime updatedAt
    }

    ApiKey {
        String id PK "UUID"
        String organizationId FK
        String name
        String keyHash UK
        DateTime lastUsedAt
        DateTime revokedAt
        DateTime createdAt
    }

    Task {
        String id PK "UUID"
        String organizationId FK
        String query
        String status "Enum: PENDING, PLANNING, RUNNING, SYNTHESIZING, COMPLETED, FAILED"
        String resultAnswer
        DateTime createdAt
        DateTime updatedAt
        DateTime completedAt
    }

    TaskStep {
        String id PK "UUID"
        String taskId FK
        String workerType "Enum: PLANNER, SEARCH, EXTRACT, SYNTHESIZE"
        String status "Enum: PENDING, RUNNING, COMPLETED, FAILED"
        Json inputData
        Json outputData
        String errorMessage
        DateTime startedAt
        DateTime completedAt
    }

    Memory {
        String id PK "UUID"
        String organizationId FK
        String taskId FK "nullable"
        String sourceUrl
        String content
        Unsupported vector "embedding (VECTOR 1536)"
        DateTime createdAt
    }

    Interaction {
        String id PK "UUID"
        String organizationId FK
        String taskId FK "nullable"
        String endpoint
        Int tokensUsed
        Float cost
        DateTime createdAt
    }
```

## 3. Core Prisma Models

Below are the core entities that will be defined in your Prisma schema (`prisma/schema.prisma`).

### `Organization`
Multi-tenant root table. Tied to Clerk for auth/identity.
- `id` (String/UUID, @id)
- `clerkOrgId` (String, @unique) - Maps to Clerk organization ID.
- `name` (String) - Org display name.
- Relations: `apiKeys`, `tasks`, `memories`, `interactions`

### `ApiKey`
Custom API keys for accessing the Sequential Task & Monitor APIs.
- `id` (String/UUID, @id)
- `organizationId` (String) - Foreign Key.
- `name` (String) - E.g., "Production Key".
- `keyHash` (String, @unique) - SHA-256 hash of the key (never store plaintext keys).

### `Task`
Top-level research jobs.
- `query` (String) - The user's original research question.
- `status` (TaskStatus Enum) - `PENDING`, `PLANNING`, `RUNNING`, etc.
- `resultAnswer` (String?) - Final synthesized answer markdown.

### `TaskStep`
Atomic operations inside a task (for the Monitor API streaming and debugging).
- `taskId` (String) - Foreign Key -> `Task.id` (OnDelete: Cascade)
- `workerType` (WorkerType Enum)
- `inputData` (Json) - Worker arguments (e.g., specific URL to scrape).
- `outputData` (Json) - Worker results (e.g., extracted page text).

### `Memory`
Stores vectorized content extracted by workers for long-term RAG/retrieval.
- `sourceUrl` (String) - Where the content was found.
- `content` (String) - Raw or chunked text.
- `embedding` (Unsupported("vector(1536)")) - Uses `pgvector`. 

### `Interaction`
Append-only log for rate limiting, usage tracking, and billing.
- `endpoint` (String)
- `tokensUsed` (Int)
- `cost` (Decimal/Float)

## 4. Local Development (Docker + Prisma)

### Running the Database Locally
We use a `docker-compose.yml` to spin up PostgreSQL with `pgvector` included natively.

```yaml
version: '3.8'
services:
  db:
    image: ankane/pgvector:latest
    environment:
      POSTGRES_USER: root
      POSTGRES_PASSWORD: password
      POSTGRES_DB: sequential_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

Start the database:
```bash
docker-compose up -d
```

### Prisma Setup & Migrations
1. Add your connection string to your `.env` file:
   `DATABASE_URL="postgresql://root:password@localhost:5432/sequential_db"`
2. Run Prisma migrations to create the tables in the database:
   ```bash
   npx prisma migrate dev --name init
   ```
3. Open **Prisma Studio** (your visual database viewer, similar to MongoDB Compass):
   ```bash
   npx prisma studio
   ```

## 5. Required Database Extensions

Prisma allows you to enable PostgreSQL extensions (like `pgvector`) directly in the `schema.prisma` file using the `postgresqlExtensions` preview feature.

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [vector]
}
```
