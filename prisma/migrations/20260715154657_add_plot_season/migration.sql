-- CreateTable
CREATE TABLE "PlotSeason" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "plotName" TEXT NOT NULL DEFAULT 'Ana parsel',
    "yearSlot" INTEGER NOT NULL,
    "cropId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlotSeason_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlotSeason_workspaceId_idx" ON "PlotSeason"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "PlotSeason_workspaceId_plotName_yearSlot_key" ON "PlotSeason"("workspaceId", "plotName", "yearSlot");

-- AddForeignKey
ALTER TABLE "PlotSeason" ADD CONSTRAINT "PlotSeason_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

