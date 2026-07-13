-- CreateTable
CREATE TABLE "CostCycle" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fixedCostsTRY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "allocation" TEXT NOT NULL,
    "areaM2" DOUBLE PRECISION,
    "totalAreaM2" DOUBLE PRECISION,
    "cycles" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CostCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostEntry" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amountTRY" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CostEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CostCycle_workspaceId_idx" ON "CostCycle"("workspaceId");

-- CreateIndex
CREATE INDEX "CostEntry_cycleId_idx" ON "CostEntry"("cycleId");

-- AddForeignKey
ALTER TABLE "CostCycle" ADD CONSTRAINT "CostCycle_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostEntry" ADD CONSTRAINT "CostEntry_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "CostCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

