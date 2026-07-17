-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "areaM2" DOUBLE PRECISION NOT NULL,
    "sunHoursObserved" DOUBLE PRECISION,
    "exactLocationKnown" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoilTest" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "ph" DOUBLE PRECISION NOT NULL,
    "ec" DOUBLE PRECISION NOT NULL,
    "organicMatterPct" DOUBLE PRECISION NOT NULL,
    "sampledAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SoilTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaterTest" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "qualityOk" BOOLEAN NOT NULL,
    "testedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaterTest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Site_workspaceId_idx" ON "Site"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Site_workspaceId_name_key" ON "Site"("workspaceId", "name");

-- CreateIndex
CREATE INDEX "SoilTest_siteId_sampledAt_idx" ON "SoilTest"("siteId", "sampledAt");

-- CreateIndex
CREATE INDEX "WaterTest_siteId_testedAt_idx" ON "WaterTest"("siteId", "testedAt");

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoilTest" ADD CONSTRAINT "SoilTest_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterTest" ADD CONSTRAINT "WaterTest_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
