-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'MANAGER', 'RECEPTIONIST', 'PRACTITIONER', 'ACCOUNTANT');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('CHILD', 'PARENT_A', 'PARENT_B', 'BOTH_PARENTS');

-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('CHILD', 'PARENT', 'BOTH_PARENTS');

-- CreateEnum
CREATE TYPE "ContactMethod" AS ENUM ('WHATSAPP', 'EMAIL');

-- CreateEnum
CREATE TYPE "BillingArrangement" AS ENUM ('REGULAR', 'SHARED_SINGLE_INVOICE', 'SHARED_SEPARATE_INVOICES');

-- CreateEnum
CREATE TYPE "InvoiceKind" AS ENUM ('SINGLE', 'PARENT_A_SHARE', 'PARENT_B_SHARE');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'VOID');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clinic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyAccount" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "invoiceName" TEXT NOT NULL,
    "invoiceTitle" TEXT,
    "invoiceDescription" TEXT,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "familyAccountId" TEXT NOT NULL,
    "externalRef" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "invoiceName" TEXT,
    "clientType" "ClientType" NOT NULL,
    "email" TEXT,
    "phoneNumber" TEXT,
    "preferredContact" "ContactMethod",
    "comments" TEXT,
    "parentAId" TEXT,
    "parentBId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "familyAccountId" TEXT NOT NULL,
    "subjectClientId" TEXT NOT NULL,
    "parentAId" TEXT,
    "parentBId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "type" "MeetingType" NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "tariff" DECIMAL(12,2) NOT NULL,
    "billingArrangement" "BillingArrangement" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "familyAccountId" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "recipientClientId" TEXT,
    "kind" "InvoiceKind" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payer" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "familyAccountId" TEXT NOT NULL,
    "clientId" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phoneNumber" TEXT,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "payerId" TEXT,
    "payerNameSnapshot" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Clinic_name_idx" ON "Clinic"("name");

-- CreateIndex
CREATE INDEX "ClinicMembership_clinicId_idx" ON "ClinicMembership"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicMembership_userId_clinicId_key" ON "ClinicMembership"("userId", "clinicId");

-- CreateIndex
CREATE INDEX "FamilyAccount_clinicId_accountName_idx" ON "FamilyAccount"("clinicId", "accountName");

-- CreateIndex
CREATE INDEX "Client_clinicId_fullName_idx" ON "Client"("clinicId", "fullName");

-- CreateIndex
CREATE INDEX "Client_familyAccountId_idx" ON "Client"("familyAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_clinicId_externalRef_key" ON "Client"("clinicId", "externalRef");

-- CreateIndex
CREATE INDEX "Meeting_clinicId_startsAt_idx" ON "Meeting"("clinicId", "startsAt");

-- CreateIndex
CREATE INDEX "Meeting_clinicId_subjectClientId_idx" ON "Meeting"("clinicId", "subjectClientId");

-- CreateIndex
CREATE INDEX "Meeting_familyAccountId_startsAt_idx" ON "Meeting"("familyAccountId", "startsAt");

-- CreateIndex
CREATE INDEX "Meeting_clinicId_type_idx" ON "Meeting"("clinicId", "type");

-- CreateIndex
CREATE INDEX "Invoice_clinicId_status_idx" ON "Invoice"("clinicId", "status");

-- CreateIndex
CREATE INDEX "Invoice_familyAccountId_createdAt_idx" ON "Invoice"("familyAccountId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_meetingId_kind_key" ON "Invoice"("meetingId", "kind");

-- CreateIndex
CREATE INDEX "Payer_clinicId_fullName_idx" ON "Payer"("clinicId", "fullName");

-- CreateIndex
CREATE INDEX "Payer_familyAccountId_idx" ON "Payer"("familyAccountId");

-- CreateIndex
CREATE INDEX "Payment_clinicId_paidAt_idx" ON "Payment"("clinicId", "paidAt");

-- CreateIndex
CREATE INDEX "Payment_meetingId_paidAt_idx" ON "Payment"("meetingId", "paidAt");

-- CreateIndex
CREATE INDEX "AuditLog_clinicId_createdAt_idx" ON "AuditLog"("clinicId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "ClinicMembership" ADD CONSTRAINT "ClinicMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicMembership" ADD CONSTRAINT "ClinicMembership_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyAccount" ADD CONSTRAINT "FamilyAccount_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_familyAccountId_fkey" FOREIGN KEY ("familyAccountId") REFERENCES "FamilyAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_parentAId_fkey" FOREIGN KEY ("parentAId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_parentBId_fkey" FOREIGN KEY ("parentBId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_familyAccountId_fkey" FOREIGN KEY ("familyAccountId") REFERENCES "FamilyAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_subjectClientId_fkey" FOREIGN KEY ("subjectClientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_parentAId_fkey" FOREIGN KEY ("parentAId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_parentBId_fkey" FOREIGN KEY ("parentBId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_familyAccountId_fkey" FOREIGN KEY ("familyAccountId") REFERENCES "FamilyAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_recipientClientId_fkey" FOREIGN KEY ("recipientClientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payer" ADD CONSTRAINT "Payer_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payer" ADD CONSTRAINT "Payer_familyAccountId_fkey" FOREIGN KEY ("familyAccountId") REFERENCES "FamilyAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payer" ADD CONSTRAINT "Payer_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "Payer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
