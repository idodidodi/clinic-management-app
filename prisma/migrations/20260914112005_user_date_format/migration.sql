-- CreateEnum
CREATE TYPE "DateFormat" AS ENUM ('DD_MM_YYYY', 'MM_DD_YYYY', 'YYYY_MM_DD');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dateFormat" "DateFormat" NOT NULL DEFAULT 'DD_MM_YYYY';
