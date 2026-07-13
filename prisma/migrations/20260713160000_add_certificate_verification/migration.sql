-- CreateEnum
CREATE TYPE "CertificateVerificationStatus" AS ENUM ('beklemede', 'onaylandi', 'reddedildi');

-- AlterTable
ALTER TABLE "Certificate" ADD COLUMN     "verificationNote" TEXT,
ADD COLUMN     "verificationStatus" "CertificateVerificationStatus" NOT NULL DEFAULT 'beklemede',
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedBy" TEXT;

-- CreateIndex
CREATE INDEX "Certificate_verificationStatus_idx" ON "Certificate"("verificationStatus");
