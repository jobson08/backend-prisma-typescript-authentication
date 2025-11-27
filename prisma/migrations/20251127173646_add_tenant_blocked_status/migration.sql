-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "blockedAt" TIMESTAMP(3),
ADD COLUMN     "blockedReason" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
