/*
  Warnings:

  - You are about to drop the column `img` on the `Responsavel` table. All the data in the column will be lost.
  - You are about to drop the column `img` on the `Tenant` table. All the data in the column will be lost.
  - The `role` column on the `Usuario` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[cpf]` on the table `Aluno` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[usuarioId]` on the table `Aluno` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,name]` on the table `CategoriaFinanceira` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[usuarioId]` on the table `Responsavel` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[domain]` on the table `Tenant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cpfCnpj]` on the table `Tenant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Aluno` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `CategoriaFinanceira` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Movimentacao` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Responsavel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Tenant` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'TREINADOR', 'RESPONSAVEL', 'ALUNO');

-- DropForeignKey
ALTER TABLE "Usuario" DROP CONSTRAINT "Usuario_alunoId_fkey";

-- DropForeignKey
ALTER TABLE "Usuario" DROP CONSTRAINT "Usuario_responsavelId_fkey";

-- DropIndex
DROP INDEX "Usuario_alunoId_idx";

-- DropIndex
DROP INDEX "Usuario_responsavelId_idx";

-- AlterTable
ALTER TABLE "Aluno" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "usuarioId" TEXT;

-- AlterTable
ALTER TABLE "CategoriaFinanceira" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Movimentacao" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Responsavel" DROP COLUMN "img",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "usuarioId" TEXT;

-- AlterTable
ALTER TABLE "Tenant" DROP COLUMN "img",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Usuario" DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'TREINADOR';

-- CreateIndex
CREATE UNIQUE INDEX "Aluno_cpf_key" ON "Aluno"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Aluno_usuarioId_key" ON "Aluno"("usuarioId");

-- CreateIndex
CREATE INDEX "Aluno_tenantId_idx" ON "Aluno"("tenantId");

-- CreateIndex
CREATE INDEX "Aluno_cpf_idx" ON "Aluno"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaFinanceira_tenantId_name_key" ON "CategoriaFinanceira"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Mensalidade_alunoId_idx" ON "Mensalidade"("alunoId");

-- CreateIndex
CREATE INDEX "Mensalidade_status_idx" ON "Mensalidade"("status");

-- CreateIndex
CREATE INDEX "Movimentacao_tenantId_idx" ON "Movimentacao"("tenantId");

-- CreateIndex
CREATE INDEX "Movimentacao_date_idx" ON "Movimentacao"("date");

-- CreateIndex
CREATE INDEX "Movimentacao_type_idx" ON "Movimentacao"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Responsavel_usuarioId_key" ON "Responsavel"("usuarioId");

-- CreateIndex
CREATE INDEX "Responsavel_tenantId_idx" ON "Responsavel"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_domain_key" ON "Tenant"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_cpfCnpj_key" ON "Tenant"("cpfCnpj");

-- CreateIndex
CREATE INDEX "Tenant_slug_idx" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "Tenant_domain_idx" ON "Tenant"("domain");

-- CreateIndex
CREATE INDEX "Usuario_role_idx" ON "Usuario"("role");

-- CreateIndex
CREATE INDEX "Usuario_email_idx" ON "Usuario"("email");

-- AddForeignKey
ALTER TABLE "Responsavel" ADD CONSTRAINT "Responsavel_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aluno" ADD CONSTRAINT "Aluno_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
