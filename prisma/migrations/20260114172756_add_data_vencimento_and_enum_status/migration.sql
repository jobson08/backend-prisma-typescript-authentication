/*
  Warnings:

  - The `status` column on the `Pagamento` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updatedAt` to the `Pagamento` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PagamentoStatus" AS ENUM ('PENDENTE', 'CONFIRMADO', 'ATRASADO', 'CANCELADO');

-- DropIndex
DROP INDEX "Pagamento_escolinhaId_dataPagamento_idx";

-- AlterTable
ALTER TABLE "Pagamento" ADD COLUMN     "dataVencimento" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "dataPagamento" DROP NOT NULL,
ALTER COLUMN "metodo" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "PagamentoStatus" NOT NULL DEFAULT 'PENDENTE';

-- CreateIndex
CREATE INDEX "Pagamento_escolinhaId_dataVencimento_idx" ON "Pagamento"("escolinhaId", "dataVencimento");

-- CreateIndex
CREATE INDEX "Pagamento_escolinhaId_status_idx" ON "Pagamento"("escolinhaId", "status");
