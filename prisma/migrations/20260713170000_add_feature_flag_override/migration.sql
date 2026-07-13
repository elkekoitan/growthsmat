-- CreateTable
CREATE TABLE "FeatureFlagOverride" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "flagKey" TEXT NOT NULL,
    "value" BOOLEAN NOT NULL,
    "updatedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlagOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeatureFlagOverride_workspaceId_idx" ON "FeatureFlagOverride"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlagOverride_workspaceId_flagKey_key" ON "FeatureFlagOverride"("workspaceId", "flagKey");

-- AddForeignKey
ALTER TABLE "FeatureFlagOverride" ADD CONSTRAINT "FeatureFlagOverride_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

