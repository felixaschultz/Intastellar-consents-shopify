-- AlterTable
ALTER TABLE "PilotLead" ADD COLUMN "intastellarAccountId" TEXT,
ADD COLUMN "intastellarSetupUrl" TEXT,
ADD COLUMN "intastellarAccountStatus" TEXT,
ADD COLUMN "intastellarAccountNote" TEXT,
ADD COLUMN "demoReadyEmailSentAt" TIMESTAMP(3);
