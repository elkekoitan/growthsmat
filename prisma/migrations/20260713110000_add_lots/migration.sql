-- CreateEnum
CREATE TYPE "LotType" AS ENUM ('tohum', 'girdi', 'uretim', 'hasat', 'paket', 'sevkiyat');

-- CreateEnum
CREATE TYPE "LotStatus" AS ENUM ('aktif', 'incelemede', 'karantina', 'geri-cagrildi', 'tuketildi');

-- CreateTable
CREATE TABLE "Lot" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "LotType" NOT NULL,
    "cropId" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "producedAt" DATE NOT NULL,
    "status" "LotStatus" NOT NULL DEFAULT 'aktif',
    "certifiedOrigin" BOOLEAN NOT NULL DEFAULT false,
    "ownerLabel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LotGenealogy" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,

    CONSTRAINT "LotGenealogy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lot_workspaceId_idx" ON "Lot"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Lot_workspaceId_code_key" ON "Lot"("workspaceId", "code");

-- CreateIndex
CREATE INDEX "LotGenealogy_parentId_idx" ON "LotGenealogy"("parentId");

-- CreateIndex
CREATE INDEX "LotGenealogy_childId_idx" ON "LotGenealogy"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "LotGenealogy_parentId_childId_key" ON "LotGenealogy"("parentId", "childId");

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotGenealogy" ADD CONSTRAINT "LotGenealogy_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Lot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotGenealogy" ADD CONSTRAINT "LotGenealogy_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Lot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

