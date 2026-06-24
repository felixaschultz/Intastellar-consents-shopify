-- CreateEnum
CREATE TYPE "PilotLeadStatus" AS ENUM ('PENDING', 'CREATING', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "PilotLead" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "currentCmp" TEXT NOT NULL,
    "shopDomain" TEXT,
    "status" "PilotLeadStatus" NOT NULL DEFAULT 'PENDING',
    "statusNote" TEXT,
    "pollToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PilotLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PilotLead_pollToken_key" ON "PilotLead"("pollToken");

-- CreateIndex
CREATE INDEX "PilotLead_shopDomain_idx" ON "PilotLead"("shopDomain");

-- CreateIndex
CREATE INDEX "PilotLead_email_idx" ON "PilotLead"("email");
