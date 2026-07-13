-- CreateEnum
CREATE TYPE "TaskKind" AS ENUM ('ekim', 'sulama', 'gubre', 'budama', 'gozlem', 'hasat');

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "areaM2" DOUBLE PRECISION NOT NULL,
    "sunHours" DOUBLE PRECISION NOT NULL,
    "containerL" DOUBLE PRECISION,
    "waterAccess" INTEGER NOT NULL,
    "weeklyMinutes" INTEGER NOT NULL,
    "experience" INTEGER NOT NULL,
    "goal" TEXT NOT NULL,
    "hasKidsOrPets" BOOLEAN NOT NULL,
    "season" TEXT NOT NULL,
    "phMeasured" BOOLEAN NOT NULL DEFAULT false,
    "phValue" DOUBLE PRECISION NOT NULL DEFAULT 6.5,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "type" "TaskKind" NOT NULL,
    "title" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "critical" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "measurement" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_workspaceId_key" ON "Plan"("workspaceId");

-- CreateIndex
CREATE INDEX "Task_workspaceId_idx" ON "Task"("workspaceId");

-- CreateIndex
CREATE INDEX "Task_workspaceId_date_idx" ON "Task"("workspaceId", "date");

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

