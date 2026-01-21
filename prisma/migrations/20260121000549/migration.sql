/*
  Warnings:

  - A unique constraint covering the columns `[escolinhaId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[funcionarioId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[alunoFutebolId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[alunoCrossfitId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[responsavelId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "AlunoFutebol" DROP CONSTRAINT "AlunoFutebol_userId_fkey";

-- DropForeignKey
ALTER TABLE "ClienteCrossfit" DROP CONSTRAINT "ClienteCrossfit_userId_fkey";

-- DropForeignKey
ALTER TABLE "Funcionario" DROP CONSTRAINT "Funcionario_userId_fkey";

-- DropForeignKey
ALTER TABLE "Responsavel" DROP CONSTRAINT "Responsavel_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "alunoCrossfitId" TEXT,
ADD COLUMN     "alunoFutebolId" TEXT,
ADD COLUMN     "funcionarioId" TEXT,
ADD COLUMN     "responsavelId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_escolinhaId_key" ON "User"("escolinhaId");

-- CreateIndex
CREATE UNIQUE INDEX "User_funcionarioId_key" ON "User"("funcionarioId");

-- CreateIndex
CREATE UNIQUE INDEX "User_alunoFutebolId_key" ON "User"("alunoFutebolId");

-- CreateIndex
CREATE UNIQUE INDEX "User_alunoCrossfitId_key" ON "User"("alunoCrossfitId");

-- CreateIndex
CREATE UNIQUE INDEX "User_responsavelId_key" ON "User"("responsavelId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Funcionario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_alunoFutebolId_fkey" FOREIGN KEY ("alunoFutebolId") REFERENCES "AlunoFutebol"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_alunoCrossfitId_fkey" FOREIGN KEY ("alunoCrossfitId") REFERENCES "ClienteCrossfit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
