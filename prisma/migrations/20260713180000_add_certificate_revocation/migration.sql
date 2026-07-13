-- AlterEnum
ALTER TYPE "CertificateVerificationStatus" ADD VALUE 'iptal-edildi';

-- AlterTable
ALTER TABLE "Certificate" ADD COLUMN     "revokedBy" TEXT,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "revocationNote" TEXT;
