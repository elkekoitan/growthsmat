-- CreateEnum
CREATE TYPE "TrackedCropStatus" AS ENUM ('planlaniyor', 'ekildi', 'buyuyor', 'hasat', 'arsiv');

-- CreateTable
CREATE TABLE "TrackedCrop" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "zone" TEXT NOT NULL DEFAULT 'Belirtilmedi',
    "status" "TrackedCropStatus" NOT NULL DEFAULT 'planlaniyor',
    "plantedAt" DATE,
    "tasksGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackedCrop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrackedCrop_workspaceId_idx" ON "TrackedCrop"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "TrackedCrop_workspaceId_cropId_zone_key" ON "TrackedCrop"("workspaceId", "cropId", "zone");

-- AddForeignKey
ALTER TABLE "TrackedCrop" ADD CONSTRAINT "TrackedCrop_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

