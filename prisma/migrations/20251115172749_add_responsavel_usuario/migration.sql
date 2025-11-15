/*
  Warnings:

  - A unique constraint covering the columns `[responsavelId]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[alunoId]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tenantId` to the `Responsavel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Responsavel" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "alunoId" TEXT,
ADD COLUMN     "responsavelId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_responsavelId_key" ON "Usuario"("responsavelId");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_alunoId_key" ON "Usuario"("alunoId");

-- CreateIndex
CREATE INDEX "Usuario_tenantId_idx" ON "Usuario"("tenantId");

-- CreateIndex
CREATE INDEX "Usuario_responsavelId_idx" ON "Usuario"("responsavelId");

-- CreateIndex
CREATE INDEX "Usuario_alunoId_idx" ON "Usuario"("alunoId");

-- AddForeignKey
ALTER TABLE "Responsavel" ADD CONSTRAINT "Responsavel_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE SET NULL ON UPDATE CASCADE;
