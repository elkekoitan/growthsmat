-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "shelves" INTEGER NOT NULL,
    "levelsPerShelf" INTEGER NOT NULL,
    "traysPerLevel" INTEGER NOT NULL,
    "airflowFactor" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "traysPerWeek" INTEGER NOT NULL,
    "deliveryDay" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Room_workspaceId_key" ON "Room"("workspaceId");

-- CreateIndex
CREATE INDEX "Subscription_workspaceId_idx" ON "Subscription"("workspaceId");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

