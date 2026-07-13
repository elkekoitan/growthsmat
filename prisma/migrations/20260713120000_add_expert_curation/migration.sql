-- CreateTable
CREATE TABLE "Expert" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credentials" TEXT NOT NULL,
    "specialties" TEXT[],
    "verification" TEXT NOT NULL,
    "avgResponseHours" INTEGER NOT NULL,
    "caseCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Expert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationCase" (
    "id" TEXT NOT NULL,
    "askedBy" TEXT NOT NULL,
    "cropId" TEXT,
    "specialty" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'acik',
    "escalationSource" TEXT NOT NULL,
    "escalationReason" TEXT,
    "assignedExpertId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "answer" TEXT,
    "answerEvidence" TEXT,
    "answeredAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultationCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorrectionSubmission" (
    "id" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "currentValue" TEXT NOT NULL,
    "proposedValue" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "submittedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'incelemede',
    "version" INTEGER NOT NULL,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CorrectionSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsultationCase_status_idx" ON "ConsultationCase"("status");

-- CreateIndex
CREATE INDEX "ConsultationCase_askedBy_idx" ON "ConsultationCase"("askedBy");

-- CreateIndex
CREATE INDEX "CorrectionSubmission_subjectId_field_idx" ON "CorrectionSubmission"("subjectId", "field");

-- CreateIndex
CREATE INDEX "CorrectionSubmission_status_idx" ON "CorrectionSubmission"("status");

-- AddForeignKey
ALTER TABLE "ConsultationCase" ADD CONSTRAINT "ConsultationCase_assignedExpertId_fkey" FOREIGN KEY ("assignedExpertId") REFERENCES "Expert"("id") ON DELETE SET NULL ON UPDATE CASCADE;

