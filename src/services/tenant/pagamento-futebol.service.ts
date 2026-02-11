// src/services/pagamento-futebol.service.ts

import { prisma } from '../../config/database';
import { addMonths, startOfMonth, endOfMonth } from 'date-fns';

export class PagamentoFutebolService {
  /*async createManual(input: CreateMensalidadeFutebolManualInput): Promise<MensalidadeFutebolResponse> {
    const { alunoId, mesReferencia, dataVencimento, valor, observacao, gerarProximo } = input;

    // Verifica se aluno existe e está ativo
    const aluno = await prisma.alunoFutebol.findUnique({
      where: { id: alunoId },
      include: { escolinha: true },
    });

    if (!aluno) throw new Error('Aluno não encontrado');
    if (aluno.status !== 'ATIVO') throw new Error('Aluno não está ativo');

    const mesInicio = new Date(mesReferencia);
    const mesFim = endOfMonth(mesInicio);

    // Evita duplicata no mesmo mês
    const existente = await prisma.mensalidadeFutebol.findFirst({
      where: {
        alunoId,
        mesReferencia: {
          gte: startOfMonth(mesInicio),
          lt: mesFim,
        },
      },
    });

    if (existente) throw new Error('Já existe mensalidade para este mês');

    // Cria a mensalidade atual (pendente ou pago, dependendo do contexto)
    const mensalidade = await prisma.mensalidadeFutebol.create({
      data: {
        alunoId,
        escolinhaId: aluno.escolinhaId,
        mesReferencia: mesInicio,
        valor,
        dataVencimento: new Date(dataVencimento),
        status: 'pendente', // pode ser 'pago' se vier com dataPagamento
        observacao,
      },
    });

    // Se marcado, gera próxima mensalidade pendente (mês seguinte)
    if (gerarProximo) {
      const proximoMes = addMonths(mesInicio, 1);
      await prisma.mensalidadeFutebol.create({
        data: {
          alunoId,
          escolinhaId: aluno.escolinhaId,
          mesReferencia: startOfMonth(proximoMes),
          valor, // mantém o mesmo valor (pode vir do plano depois)
          dataVencimento: startOfMonth(proximoMes),
          status: 'pendente',
        },
      });
    }

    return mensalidade;
  }
*/
  // Geração automática (chamada por cron)
  async generateAutomatic(mesReferencia?: string) {
    const mes = mesReferencia ? new Date(mesReferencia) : new Date();
    const mesInicio = startOfMonth(mes);
    const mesFim = endOfMonth(mes);

    // Alunos ativos que já têm pelo menos um pagamento (evita gerar para novos sem primeiro manual)
    const alunosElegiveis = await prisma.alunoFutebol.findMany({
      where: {
        status: 'ATIVO',
        mensalidades: { some: { status: 'PAGO' } },
      },
    });

    const created: any[] = [];
    const skipped: string[] = [];

    for (const aluno of alunosElegiveis) {
      const existente = await prisma.mensalidadeFutebol.findFirst({
        where: {
          alunoId: aluno.id,
          mesReferencia: {
            gte: mesInicio,
            lt: mesFim,
          },
        },
      });

      if (existente) {
        skipped.push(aluno.nome);
        continue;
      }

      // Valor padrão - idealmente viria do plano do aluno
      const valor = 150.00; // ← substitua por lógica real (plano, mensalidade fixa, etc.)

      const novoPendente = await prisma.mensalidadeFutebol.create({
        data: {
          alunoId: aluno.id,
          escolinhaId: aluno.escolinhaId,
          mesReferencia: mesInicio,
          valor,
          dataVencimento: new Date(mesInicio.getFullYear(), mesInicio.getMonth(), 10),
          status: 'pendente',
        },
      });

      created.push(novoPendente);
    }

    return {
      createdCount: created.length,
      created,
      skippedCount: skipped.length,
      skipped,
    };
  }
}

export const pagamentoFutebolService = new PagamentoFutebolService();