-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "assignedToUserId" TEXT;

-- CreateIndex
CREATE INDEX "Task_assignedToUserId_idx" ON "Task"("assignedToUserId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

