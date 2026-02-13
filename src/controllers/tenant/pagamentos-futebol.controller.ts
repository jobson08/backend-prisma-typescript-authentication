// src/controllers/tenant/pagamentos-futebol.controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { endOfMonth, startOfDay, startOfMonth } from 'date-fns';


const createManualMensalidadeFutebolSchema = z.object({
  mesReferencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD'),
  dataVencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD'),
  valor: z.number().positive('Valor deve ser maior que zero'),
  observacao: z.string().optional(),
});

export class PagamentosFutebolController {
  // GERAÇÃO MANUAL (administrador cria uma mensalidade específica)
async createManual(req: Request, res: Response) {
  try {
    const { alunoId } = req.params;
    const escolinhaId = req.escolinhaId!;
    const body = createManualMensalidadeFutebolSchema.parse(req.body);

    const aluno = await prisma.alunoFutebol.findFirst({
      where: { id: alunoId, escolinhaId },
    });

    if (!aluno) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    // Use startOfMonth e startOfDay com data local explícita
    const mesInicio = new Date(body.mesReferencia + 'T00:00:00Z'); // força local
    const mesReferenciaParaSalvar = startOfMonth(mesInicio);

    const dataVencimentoParaSalvar = startOfDay(new Date(body.dataVencimento + 'T00:00:00')); // força início do dia local

    const mesFim = endOfMonth(mesInicio);

    const existente = await prisma.mensalidadeFutebol.findFirst({
      where: {
        alunoId,
        mesReferencia: {
          gte: mesReferenciaParaSalvar,
          lt: mesFim,
        },
      },
    });

    if (existente) {
      return res.status(409).json({ error: 'Já existe mensalidade para este mês' });
    }

    const mensalidade = await prisma.mensalidadeFutebol.create({
      data: {
        alunoId,
        escolinhaId,
        mesReferencia: mesReferenciaParaSalvar,
        valor: body.valor,
        dataVencimento: dataVencimentoParaSalvar,
        status: 'pendente',
        metodoPagamento: null,
        observacao: body.observacao,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Mensalidade manual criada com sucesso',
      data: mensalidade,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.issues,
      });
    }
    console.error(error);
    return res.status(500).json({ error: 'Erro ao criar mensalidade manual' });
  }
}

  // GERAÇÃO AUTOMÁTICA (chamada por cron job)
  async generateAutomatic(req: Request, res: Response) {
    try {
      const { mesReferencia } = req.body; // ex: "2025-03-01" (opcional, se não vier usa mês atual)

      const mes = mesReferencia ? new Date(mesReferencia) : new Date();
      mes.setDate(1); // primeiro dia do mês
      mes.setHours(0, 0, 0, 0);

      const mesFim = new Date(mes);
      mesFim.setMonth(mesFim.getMonth() + 1);

      // Busca todos alunos ativos da escolinha (ou de todas, dependendo do cron)
      const alunos = await prisma.alunoFutebol.findMany({
        where: {
          status: 'ativo',
          // escolinhaId: req.escolinhaId, // se o cron for por escolinha
        },
      });

      if (alunos.length === 0) {
        return res.json({ success: true, message: 'Nenhum aluno ativo encontrado' });
      }

      const created: any[] = [];
      const skipped: string[] = [];

      for (const aluno of alunos) {
        // Verifica se já existe para esse mês
        const existente = await prisma.mensalidadeFutebol.findFirst({
          where: {
            alunoId: aluno.id,
            mesReferencia: {
              gte: mes,
              lt: mesFim,
            },
          },
        });

        if (existente) {
          skipped.push(aluno.nome);
          continue;
        }

        // Valor padrão: ajuste aqui ou busque do aluno/plano
        const valor = 90.00; // ← ajuste conforme sua regra de negócio

        const mensalidade = await prisma.mensalidadeFutebol.create({
          data: {
            alunoId: aluno.id,
            escolinhaId: aluno.escolinhaId,
            mesReferencia: mes,
            valor,
            dataVencimento: new Date(mes.getFullYear(), mes.getMonth(), 10), // dia 10
            status: 'pendente',
          },
        });

        created.push(mensalidade);
      }

      return res.json({
        success: true,
        message: `Geradas ${created.length} mensalidades automáticas. ${skipped.length} puladas (já existiam).`,
        created,
        skipped,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro na geração automática de mensalidades' });
    }
  }
// Novo método: Busca histórico de pagamentos do aluno
  async listByAluno(req: Request, res: Response) {
    try {
      const { alunoId } = req.params;
      const escolinhaId = req.escolinhaId!; // middleware de autenticação

      // Verifica se o aluno existe e pertence à escolinha
      const aluno = await prisma.alunoFutebol.findFirst({
        where: {
          id: alunoId,
          escolinhaId,
        },
      });

      if (!aluno) {
        return res.status(404).json({ error: 'Aluno não encontrado ou não pertence à escolinha' });
      }

      // Busca todos os pagamentos/mensalidades do aluno, ordenados por mês (mais recente primeiro)
      const pagamentos = await prisma.mensalidadeFutebol.findMany({
        where: {
          alunoId,
        },
        orderBy: [
          { mesReferencia: 'desc' }, // mais recente primeiro
        ],
        select: {
          id: true,
          mesReferencia: true,
          valor: true,
          dataVencimento: true,
          dataPagamento: true,
          metodoPagamento: true,
          status: true,
          observacao: true,
        },
      });

      // Define a variável "pagamentos" e retorna
      return res.status(200).json({
        success: true,
        message: `Encontrados ${pagamentos.length} pagamentos para o aluno`,
        data: pagamentos, // ← aqui está definida "pagamentos"
      });
    } catch (error) {
      console.error('[listByAluno]', error);
      return res.status(500).json({ error: 'Erro ao buscar histórico de pagamentos' });
    }
  }

}

export const pagamentosFutebolController = new PagamentosFutebolController();