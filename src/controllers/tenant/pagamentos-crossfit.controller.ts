// src/controllers/tenant/pagamentos-futebol.controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { PagamentosCrossfitService } from '../../services/tenant/pagamentos-crossfit.service';

const service = new PagamentosCrossfitService();

const createManualSchema = z.object({
  mesReferencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD'),
  dataVencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD'),
  valor: z.number().positive('Valor deve ser maior que zero'),
  observacao: z.string().optional(),
});

export const createManualCrossfit = async (req: Request, res: Response) => {
  try {
    const { alunoId } = req.params;           // ← aqui captura o ID da URL
    const escolinhaId = req.escolinhaId!;

    if (!alunoId) {
      return res.status(400).json({ error: 'alunoId é obrigatório na URL' });
    }

    const body = createManualSchema.parse(req.body);

    const mensalidade = await service.createManual(
      alunoId,
      escolinhaId,
      body
    );

    return res.status(201).json({
      success: true,
      message: 'Mensalidade manual CrossFit criada com sucesso',
      data: mensalidade,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.issues,
      });
    }

    console.error('[CREATE MANUAL CROSSFIT]', error);

    if (error.message.includes('não encontrado') || error.message.includes('obrigatório')) {
      return res.status(404).json({ error: error.message });
    }

    if (error.message.includes('já existe')) {
      return res.status(409).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Erro interno ao criar mensalidade' });
  }
};

//-------------------------------Gerar pagamento aotomatico-------------------------------
  export const generateAutomaticCrossfit = async (req: Request, res: Response) => {
  try {
      const escolinhaId = req.escolinhaId!;
      const { mesReferencia } = req.body;

      const result = await service.generateAutomatic(escolinhaId, mesReferencia);

      return res.json(result);
    } catch (error: any) {
      console.error('[GENERATE AUTO CROSSFIT]', error);
      return res.status(500).json({ error: 'Erro na geração automática CrossFit' });
    }
  }

  export const listByAlunoCrossfit = async (req: Request, res: Response) => {
   try {
      const { clienteId } = req.params;
      const escolinhaId = req.escolinhaId!;

      const pagamentos = await service.listByAluno(clienteId, escolinhaId);

      return res.json({
        success: true,
        message: `Encontrados ${pagamentos.length} pagamentos CrossFit`,
        data: pagamentos,
      });
    } catch (error: any) {
      console.error('[LIST BY ALUNO CROSSFIT]', error);
      return res.status(500).json({ error: 'Erro ao buscar histórico CrossFit' });
    }
  }

//-------------------------------------Excluir pagamento------------------------------------

export const deletePagamentoCrossfit = async (req: Request, res: Response) => {
  try {
    const { alunoId, pagamentoId } = req.params;  // ← mude para alunoId se a rota usar :alunoId
    const escolinhaId = req.escolinhaId!;

    console.log('[DELETE CROSSFIT CHAMADO] alunoId:', alunoId, 'pagamentoId:', pagamentoId);

    if (!alunoId || !pagamentoId) {
      return res.status(400).json({ error: 'alunoId e pagamentoId são obrigatórios' });
    }

    const result = await service.deletePagamento(
      alunoId,
      pagamentoId,
      escolinhaId
    );

    return res.json(result);
  } catch (error: any) {
    console.error('[DELETE PAGAMENTO CROSSFIT]', error);
    // ... resto do tratamento
  }
};
