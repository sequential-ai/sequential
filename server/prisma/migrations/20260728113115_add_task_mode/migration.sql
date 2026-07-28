-- CreateEnum
CREATE TYPE "TaskMode" AS ENUM ('FAST', 'STANDARD', 'DEEP');

-- DropIndex
DROP INDEX "Memory_embedding_hnsw_idx";

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "mode" "TaskMode" NOT NULL DEFAULT 'STANDARD';
