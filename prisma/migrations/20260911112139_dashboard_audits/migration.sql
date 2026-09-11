-- CreateEnum
CREATE TYPE "MeetingWorkflowStatus" AS ENUM ('REGISTERED', 'REMINDER_SENT', 'PAID_INVOICE_PENDING', 'PAID_INVOICE_ISSUED');

-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "workflowStatus" "MeetingWorkflowStatus" NOT NULL DEFAULT 'REGISTERED';

-- CreateTable
CREATE TABLE "ClientAudit" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingAudit" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAudit" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientAudit_clinicId_createdAt_idx" ON "ClientAudit"("clinicId", "createdAt");

-- CreateIndex
CREATE INDEX "ClientAudit_clientId_createdAt_idx" ON "ClientAudit"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "MeetingAudit_clinicId_createdAt_idx" ON "MeetingAudit"("clinicId", "createdAt");

-- CreateIndex
CREATE INDEX "MeetingAudit_meetingId_createdAt_idx" ON "MeetingAudit"("meetingId", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentAudit_clinicId_createdAt_idx" ON "PaymentAudit"("clinicId", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentAudit_paymentId_createdAt_idx" ON "PaymentAudit"("paymentId", "createdAt");

-- AddForeignKey
ALTER TABLE "ClientAudit" ADD CONSTRAINT "ClientAudit_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientAudit" ADD CONSTRAINT "ClientAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAudit" ADD CONSTRAINT "MeetingAudit_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAudit" ADD CONSTRAINT "MeetingAudit_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAudit" ADD CONSTRAINT "MeetingAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAudit" ADD CONSTRAINT "PaymentAudit_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAudit" ADD CONSTRAINT "PaymentAudit_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAudit" ADD CONSTRAINT "PaymentAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
