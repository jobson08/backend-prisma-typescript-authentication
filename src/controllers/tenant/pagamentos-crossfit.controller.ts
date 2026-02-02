// src/controllers/tenant/pagamentos-crossfit.controller.ts
import { Request, Response } from 'express';

import { z } from 'zod';
import { prisma } from '../../config/database';

// Schema para criação manual
const createManualMensalidadeSchema = z.object({
  mesReferencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD'),
  dataVencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD'),
  valor: z.number().positive('Valor deve ser maior que zero'),
  observacao: z.string().optional(),
});

export class PagamentosCrossfitController {
  // GERAÇÃO MANUAL (administrador cria uma mensalidade específica)
  async createManual(req: Request, res: Response) {
    try {
      const { alunoId } = req.params;
      const escolinhaId = req.escolinhaId!;
      const body = createManualMensalidadeSchema.parse(req.body);

      // Verifica se aluno existe e pertence à escolinha
      const aluno = await prisma.alunoCrossfit.findFirst({
        where: {
          id: alunoId,
          escolinhaId,
        },
      });

      if (!aluno) {
        return res.status(404).json({ error: 'Aluno não encontrado' });
      }

      // Verifica se já existe mensalidade para esse mês (evita duplicata)
      const mesInicio = new Date(body.mesReferencia);
      const mesFim = new Date(mesInicio);
      mesFim.setMonth(mesFim.getMonth() + 1);

      const existente = await prisma.mensalidadeCrossfit.findFirst({
        where: {
          clienteId: alunoId,
          mesReferencia: {
            gte: mesInicio,
            lt: mesFim,
          },
        },
      });

      if (existente) {
        return res.status(409).json({ error: 'Já existe mensalidade para este mês' });
      }

      const mensalidade = await prisma.mensalidadeCrossfit.create({
        data: {
          clienteId: alunoId,
          escolinhaId,
          mesReferencia: mesInicio,
          valor: body.valor,
          dataVencimento: new Date(body.dataVencimento),
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
      const alunos = await prisma.alunoCrossfit.findMany({
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
        const existente = await prisma.mensalidadeCrossfit.findFirst({
          where: {
            clienteId: aluno.id,
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

        // Valor padrão: você pode vir de um campo no aluno ou tabela de planos
        const valor = 149.00; // ← ajuste aqui ou busque do aluno/plano

        const mensalidade = await prisma.mensalidadeCrossfit.create({
          data: {
            clienteId: aluno.id,
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
}

export const pagamentosCrossfitController = new PagamentosCrossfitController();