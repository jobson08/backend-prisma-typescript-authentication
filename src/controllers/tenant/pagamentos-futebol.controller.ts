// src/controllers/tenant/pagamentos-futebol.controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { endOfMonth, startOfDay, startOfMonth } from 'date-fns';
import { PagamentosFutebolService } from '../../services/tenant/pagamento-futebol.service';


// src/controllers/tenant/pagamentos-futebol.controller.ts

const service = new PagamentosFutebolService();

const createManualSchema = z.object({
  mesReferencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD'),
  dataVencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD'),
  valor: z.number().positive('Valor deve ser maior que zero'),
  observacao: z.string().optional(),
});
//------------------------crate pagamento-----------------------------------
export const createPagamentoManualFutebol = async (req: Request, res: Response) => {
  try {
      const { alunoId } = req.params;
      const escolinhaId = req.escolinhaId!;
      const body = createManualSchema.parse(req.body);

      const mensalidade = await service.createManual(alunoId, escolinhaId, body);

      return res.status(201).json({
        success: true,
        message: 'Mensalidade manual criada com sucesso',
        data: mensalidade,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: error.issues,
        });
      }
      console.error('[CREATE MANUAL FUTEBOL]', error);
      return res.status(500).json({ error: 'Erro ao criar mensalidade manual' });
    }
  }
//------------------------crate pagamento automatico-----------------------------------
  export const generatePagamentoAutomaticFutebol = async (req: Request, res: Response) => {
    try {
      const escolinhaId = req.escolinhaId!;
      const { mesReferencia } = req.body;

      const result = await service.generateAutomatic(escolinhaId, mesReferencia);

      return res.json(result);
    } catch (error: any) {
      console.error('[GENERATE AUTO FUTEBOL]', error);
      return res.status(500).json({ error: 'Erro na geração automática' });
    }
  }
//------------------------Listar aluno-----------------------------------
  export const listByAlunoFutebol = async (req: Request, res: Response) => {
    try {
      const { alunoId } = req.params;
      const escolinhaId = req.escolinhaId!;

      const pagamentos = await service.listByAluno(alunoId, escolinhaId);

      return res.json({
        success: true,
        message: `Encontrados ${pagamentos.length} pagamentos`,
        data: pagamentos,
      });
    } catch (error: any) {
      console.error('[LIST BY ALUNO FUTEBOL]', error);
      return res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
  }
/**
 * DELETE /mensalidades-futebol/:pagamentoId
 * Deleta um pagamento específico
 */
 /**
 * DELETE /mensalidades-futebol/:alunoId/pagamentos/:pagamentoId
 * Deleta um pagamento específico de um aluno
 */
export const deletePagamentoFutebol = async (req: Request, res: Response) => {
  try {
    const { alunoId, pagamentoId } = req.params;
    const escolinhaId = req.escolinhaId!;

    if (!alunoId || !pagamentoId) {
      return res.status(400).json({ error: 'alunoId e pagamentoId são obrigatórios' });
    }

    // Correção aqui: use a instância "service" (já criada no topo)
    const result = await service.deletePagamento(
      alunoId,
      pagamentoId,
      escolinhaId
    );

    return res.json(result);
  } catch (error: any) {
    console.error('[DELETE PAGAMENTO FUTEBOL]', error);
      console.log('DELETE PAGAMENTO CHAMADO - alunoId:', req.params.alunoId, 'pagamentoId:', req.params.pagamentoId);

    if (error.message.includes('não encontrado')) {
      return res.status(404).json({ error: error.message });
    }

    if (error.message.includes('pertence ao aluno') || error.message.includes('pertence à sua escolinha')) {
      return res.status(403).json({ error: error.message });
    }

    if (error.message.includes('já realizado')) {
      return res.status(403).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Erro ao deletar pagamento' });
  }
};
