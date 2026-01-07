/*
  Warnings:

  - You are about to drop the column `name` on the `Responsavel` table. All the data in the column will be lost.
  - You are about to drop the column `observations` on the `Responsavel` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Responsavel` table. All the data in the column will be lost.
  - You are about to drop the column `relacionamento` on the `Responsavel` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `Responsavel` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Responsavel` table. All the data in the column will be lost.
  - You are about to drop the column `usuarioId` on the `Responsavel` table. All the data in the column will be lost.
  - You are about to drop the `Aluno` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CategoriaFinanceira` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Mensalidade` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Movimentacao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tenant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Usuario` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Responsavel` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `escolinhaId` to the `Responsavel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nome` to the `Responsavel` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `Responsavel` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPERADMIN', 'ADMIN', 'TREINADOR', 'RESPONSAVEL', 'ALUNO_FUTEBOL', 'ALUNO_CROSSFIT', 'FUNCIONARIO');

-- DropForeignKey
ALTER TABLE "Aluno" DROP CONSTRAINT "Aluno_responsavelId_fkey";

-- DropForeignKey
ALTER TABLE "Aluno" DROP CONSTRAINT "Aluno_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Aluno" DROP CONSTRAINT "Aluno_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "CategoriaFinanceira" DROP CONSTRAINT "CategoriaFinanceira_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Mensalidade" DROP CONSTRAINT "Mensalidade_alunoId_fkey";

-- DropForeignKey
ALTER TABLE "Mensalidade" DROP CONSTRAINT "Mensalidade_movimentacaoId_fkey";

-- DropForeignKey
ALTER TABLE "Movimentacao" DROP CONSTRAINT "Movimentacao_alunoId_fkey";

-- DropForeignKey
ALTER TABLE "Movimentacao" DROP CONSTRAINT "Movimentacao_categoriaId_fkey";

-- DropForeignKey
ALTER TABLE "Movimentacao" DROP CONSTRAINT "Movimentacao_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Responsavel" DROP CONSTRAINT "Responsavel_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Responsavel" DROP CONSTRAINT "Responsavel_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "Usuario" DROP CONSTRAINT "Usuario_tenantId_fkey";

-- DropIndex
DROP INDEX "Responsavel_tenantId_idx";

-- DropIndex
DROP INDEX "Responsavel_usuarioId_key";

-- AlterTable
ALTER TABLE "Responsavel" DROP COLUMN "name",
DROP COLUMN "observations",
DROP COLUMN "phone",
DROP COLUMN "relacionamento",
DROP COLUMN "tenantId",
DROP COLUMN "updatedAt",
DROP COLUMN "usuarioId",
ADD COLUMN     "escolinhaId" TEXT NOT NULL,
ADD COLUMN     "fotoUrl" TEXT,
ADD COLUMN     "nome" TEXT NOT NULL,
ADD COLUMN     "telefone" TEXT,
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "email" SET NOT NULL;

-- DropTable
DROP TABLE "Aluno";

-- DropTable
DROP TABLE "CategoriaFinanceira";

-- DropTable
DROP TABLE "Mensalidade";

-- DropTable
DROP TABLE "Movimentacao";

-- DropTable
DROP TABLE "Tenant";

-- DropTable
DROP TABLE "Usuario";

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "escolinhaId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanoSaaS" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "valorMensal" DOUBLE PRECISION NOT NULL,
    "valorAnual" DOUBLE PRECISION,
    "limiteAlunos" INTEGER,
    "features" TEXT[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanoSaaS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pagamento" (
    "id" TEXT NOT NULL,
    "escolinhaId" TEXT NOT NULL,
    "responsavelId" TEXT,
    "valor" DOUBLE PRECISION NOT NULL,
    "dataPagamento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metodo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "referenciaId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmado',
    "comprovanteUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Escolinha" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT,
    "logoUrl" TEXT,
    "tipoDocumento" TEXT,
    "documento" TEXT,
    "nomeResponsavel" TEXT,
    "emailContato" TEXT,
    "telefone" TEXT,
    "planoSaaS" TEXT NOT NULL,
    "valorPlanoMensal" DOUBLE PRECISION NOT NULL,
    "dataInicioPlano" TIMESTAMP(3),
    "dataProximoCobranca" TIMESTAMP(3),
    "statusPagamentoSaaS" TEXT NOT NULL DEFAULT 'ativo',
    "valorMensalidadeFutebol" DOUBLE PRECISION NOT NULL,
    "valorMensalidadeCrossfit" DOUBLE PRECISION,
    "valorAulaExtraPadrao" DOUBLE PRECISION,
    "diaVencimento" INTEGER NOT NULL,
    "aulasExtrasAtivas" BOOLEAN NOT NULL DEFAULT false,
    "crossfitAtivo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Escolinha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Funcionario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "salario" DOUBLE PRECISION,
    "fotoUrl" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "escolinhaId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Funcionario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlunoFutebol" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "idade" INTEGER NOT NULL,
    "categoria" TEXT NOT NULL,
    "fotoUrl" TEXT,
    "frequenciaMes" INTEGER NOT NULL DEFAULT 0,
    "mediaAvaliacao" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "escolinhaId" TEXT NOT NULL,
    "responsavelId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "AlunoFutebol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteCrossfit" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "email" TEXT NOT NULL,
    "fotoUrl" TEXT,
    "frequencia" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "escolinhaId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "ClienteCrossfit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MensalidadeFutebol" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "escolinhaId" TEXT NOT NULL,
    "mesReferencia" TIMESTAMP(3) NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "dataPagamento" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "metodoPagamento" TEXT,
    "pagamentoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MensalidadeFutebol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MensalidadeCrossfit" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "escolinhaId" TEXT NOT NULL,
    "mesReferencia" TIMESTAMP(3) NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "dataPagamento" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "metodoPagamento" TEXT,
    "pagamentoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MensalidadeCrossfit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AulaExtra" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "hora" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'agendada',
    "alunoId" TEXT NOT NULL,
    "treinadorId" TEXT,
    "escolinhaId" TEXT NOT NULL,
    "pagamentoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AulaExtra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Treino" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "data" TIMESTAMP(3) NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFim" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "local" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "escolinhaId" TEXT NOT NULL,
    "treinadorId" TEXT NOT NULL,

    CONSTRAINT "Treino_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presenca" (
    "id" TEXT NOT NULL,
    "presente" BOOLEAN NOT NULL DEFAULT false,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alunoId" TEXT NOT NULL,
    "treinoId" TEXT NOT NULL,
    "escolinhaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Presenca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresencaCrossfit" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clienteId" TEXT NOT NULL,
    "escolinhaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PresencaCrossfit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Avaliacao" (
    "id" TEXT NOT NULL,
    "notaControleBola" DOUBLE PRECISION NOT NULL,
    "notaPasse" DOUBLE PRECISION NOT NULL,
    "notaDrible" DOUBLE PRECISION NOT NULL,
    "notaFinalizacao" DOUBLE PRECISION NOT NULL,
    "notaCondicionamento" DOUBLE PRECISION NOT NULL,
    "notaInteligenciaTatica" DOUBLE PRECISION NOT NULL,
    "notaComportamento" DOUBLE PRECISION NOT NULL,
    "media" DOUBLE PRECISION NOT NULL,
    "comentario" TEXT,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alunoId" TEXT NOT NULL,
    "treinadorId" TEXT NOT NULL,
    "escolinhaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EscolinhaToPlanoSaaS" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EscolinhaToPlanoSaaS_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PlanoSaaS_slug_key" ON "PlanoSaaS"("slug");

-- CreateIndex
CREATE INDEX "Pagamento_escolinhaId_dataPagamento_idx" ON "Pagamento"("escolinhaId", "dataPagamento");

-- CreateIndex
CREATE INDEX "Pagamento_tipo_idx" ON "Pagamento"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "Escolinha_documento_key" ON "Escolinha"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "Funcionario_email_key" ON "Funcionario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Funcionario_userId_key" ON "Funcionario"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AlunoFutebol_cpf_key" ON "AlunoFutebol"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "AlunoFutebol_userId_key" ON "AlunoFutebol"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClienteCrossfit_cpf_key" ON "ClienteCrossfit"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "ClienteCrossfit_email_key" ON "ClienteCrossfit"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ClienteCrossfit_userId_key" ON "ClienteCrossfit"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MensalidadeFutebol_alunoId_mesReferencia_key" ON "MensalidadeFutebol"("alunoId", "mesReferencia");

-- CreateIndex
CREATE UNIQUE INDEX "MensalidadeCrossfit_clienteId_mesReferencia_key" ON "MensalidadeCrossfit"("clienteId", "mesReferencia");

-- CreateIndex
CREATE INDEX "Presenca_escolinhaId_data_idx" ON "Presenca"("escolinhaId", "data");

-- CreateIndex
CREATE UNIQUE INDEX "Presenca_alunoId_treinoId_key" ON "Presenca"("alunoId", "treinoId");

-- CreateIndex
CREATE INDEX "PresencaCrossfit_escolinhaId_data_idx" ON "PresencaCrossfit"("escolinhaId", "data");

-- CreateIndex
CREATE UNIQUE INDEX "PresencaCrossfit_clienteId_data_key" ON "PresencaCrossfit"("clienteId", "data");

-- CreateIndex
CREATE INDEX "Avaliacao_escolinhaId_data_idx" ON "Avaliacao"("escolinhaId", "data");

-- CreateIndex
CREATE INDEX "_EscolinhaToPlanoSaaS_B_index" ON "_EscolinhaToPlanoSaaS"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Responsavel_userId_key" ON "Responsavel"("userId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_escolinhaId_fkey" FOREIGN KEY ("escolinhaId") REFERENCES "Escolinha"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_escolinhaId_fkey" FOREIGN KEY ("escolinhaId") REFERENCES "Escolinha"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Funcionario" ADD CONSTRAINT "Funcionario_escolinhaId_fkey" FOREIGN KEY ("escolinhaId") REFERENCES "Escolinha"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Funcionario" ADD CONSTRAINT "Funcionario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlunoFutebol" ADD CONSTRAINT "AlunoFutebol_escolinhaId_fkey" FOREIGN KEY ("escolinhaId") REFERENCES "Escolinha"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlunoFutebol" ADD CONSTRAINT "AlunoFutebol_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlunoFutebol" ADD CONSTRAINT "AlunoFutebol_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteCrossfit" ADD CONSTRAINT "ClienteCrossfit_escolinhaId_fkey" FOREIGN KEY ("escolinhaId") REFERENCES "Escolinha"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClienteCrossfit" ADD CONSTRAINT "ClienteCrossfit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Responsavel" ADD CONSTRAINT "Responsavel_escolinhaId_fkey" FOREIGN KEY ("escolinhaId") REFERENCES "Escolinha"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Responsavel" ADD CONSTRAINT "Responsavel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensalidadeFutebol" ADD CONSTRAINT "MensalidadeFutebol_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "AlunoFutebol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensalidadeFutebol" ADD CONSTRAINT "MensalidadeFutebol_escolinhaId_fkey" FOREIGN KEY ("escolinhaId") REFERENCES "Escolinha"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensalidadeFutebol" ADD CONSTRAINT "MensalidadeFutebol_pagamentoId_fkey" FOREIGN KEY ("pagamentoId") REFERENCES "Pagamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensalidadeCrossfit" ADD CONSTRAINT "MensalidadeCrossfit_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteCrossfit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensalidadeCrossfit" ADD CONSTRAINT "MensalidadeCrossfit_escolinhaId_fkey" FOREIGN KEY ("escolinhaId") REFERENCES "Escolinha"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensalidadeCrossfit" ADD CONSTRAINT "MensalidadeCrossfit_pagamentoId_fkey" FOREIGN KEY ("pagamentoId") REFERENCES "Pagamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AulaExtra" ADD CONSTRAINT "AulaExtra_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "AlunoFutebol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AulaExtra" ADD CONSTRAINT "AulaExtra_treinadorId_fkey" FOREIGN KEY ("treinadorId") REFERENCES "Funcionario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AulaExtra" ADD CONSTRAINT "AulaExtra_escolinhaId_fkey" FOREIGN KEY ("escolinhaId") REFERENCES "Escolinha"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AulaExtra" ADD CONSTRAINT "AulaExtra_pagamentoId_fkey" FOREIGN KEY ("pagamentoId") REFERENCES "Pagamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Treino" ADD CONSTRAINT "Treino_escolinhaId_fkey" FOREIGN KEY ("escolinhaId") REFERENCES "Escolinha"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Treino" ADD CONSTRAINT "Treino_treinadorId_fkey" FOREIGN KEY ("treinadorId") REFERENCES "Funcionario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presenca" ADD CONSTRAINT "Presenca_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "AlunoFutebol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presenca" ADD CONSTRAINT "Presenca_treinoId_fkey" FOREIGN KEY ("treinoId") REFERENCES "Treino"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presenca" ADD CONSTRAINT "Presenca_escolinhaId_fkey" FOREIGN KEY ("escolinhaId") REFERENCES "Escolinha"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresencaCrossfit" ADD CONSTRAINT "PresencaCrossfit_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteCrossfit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresencaCrossfit" ADD CONSTRAINT "PresencaCrossfit_escolinhaId_fkey" FOREIGN KEY ("escolinhaId") REFERENCES "Escolinha"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "AlunoFutebol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_treinadorId_fkey" FOREIGN KEY ("treinadorId") REFERENCES "Funcionario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_escolinhaId_fkey" FOREIGN KEY ("escolinhaId") REFERENCES "Escolinha"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EscolinhaToPlanoSaaS" ADD CONSTRAINT "_EscolinhaToPlanoSaaS_A_fkey" FOREIGN KEY ("A") REFERENCES "Escolinha"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EscolinhaToPlanoSaaS" ADD CONSTRAINT "_EscolinhaToPlanoSaaS_B_fkey" FOREIGN KEY ("B") REFERENCES "PlanoSaaS"("id") ON DELETE CASCADE ON UPDATE CASCADE;
