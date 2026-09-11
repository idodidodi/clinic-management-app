-- CreateEnum
CREATE TYPE "ParentRole" AS ENUM ('MOM', 'DAD');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "parentRole" "ParentRole";

-- AlterTable
ALTER TABLE "FamilyAccount" ADD COLUMN     "parentOneRole" "ParentRole" NOT NULL DEFAULT 'MOM',
ADD COLUMN     "parentTwoRole" "ParentRole" NOT NULL DEFAULT 'DAD';

-- CreateTable
CREATE TABLE "MeetingParticipant" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "MeetingParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MeetingParticipant_clientId_idx" ON "MeetingParticipant"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingParticipant_meetingId_clientId_key" ON "MeetingParticipant"("meetingId", "clientId");

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
