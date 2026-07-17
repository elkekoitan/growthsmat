-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentMethod" TEXT NOT NULL DEFAULT 'belirtilmedi',
ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'bekliyor',
ADD COLUMN     "paidAt" TIMESTAMP(3);
