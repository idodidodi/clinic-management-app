-- CreateEnum
CREATE TYPE "ClientRelationType" AS ENUM ('PARENT', 'CHILD', 'OTHER');

-- AlterEnum
ALTER TYPE "ClientType" ADD VALUE 'OTHER';

-- CreateTable
CREATE TABLE "ClientRelation" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "relatedClientId" TEXT NOT NULL,
    "relationType" "ClientRelationType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientRelation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientRelation_relatedClientId_idx" ON "ClientRelation"("relatedClientId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientRelation_clientId_relatedClientId_key" ON "ClientRelation"("clientId", "relatedClientId");

-- AddForeignKey
ALTER TABLE "ClientRelation" ADD CONSTRAINT "ClientRelation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientRelation" ADD CONSTRAINT "ClientRelation_relatedClientId_fkey" FOREIGN KEY ("relatedClientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
