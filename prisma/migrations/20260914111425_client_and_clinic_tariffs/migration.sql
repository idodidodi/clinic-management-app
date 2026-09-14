-- AlterTable
ALTER TABLE "Clinic" ADD COLUMN     "defaultTariff" DECIMAL(12,2) NOT NULL DEFAULT 100;

-- CreateTable
CREATE TABLE "ClinicTariff" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "meetingType" "MeetingType" NOT NULL,
    "tariff" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "ClinicTariff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientTariff" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "meetingType" "MeetingType" NOT NULL,
    "tariff" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "ClientTariff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClinicTariff_clinicId_meetingType_key" ON "ClinicTariff"("clinicId", "meetingType");

-- CreateIndex
CREATE UNIQUE INDEX "ClientTariff_clientId_meetingType_key" ON "ClientTariff"("clientId", "meetingType");

-- AddForeignKey
ALTER TABLE "ClinicTariff" ADD CONSTRAINT "ClinicTariff_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientTariff" ADD CONSTRAINT "ClientTariff_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
