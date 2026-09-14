/*
  Warnings:

  - You are about to drop the `ClinicTariff` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ClinicTariff" DROP CONSTRAINT "ClinicTariff_clinicId_fkey";

-- DropTable
DROP TABLE "ClinicTariff";
