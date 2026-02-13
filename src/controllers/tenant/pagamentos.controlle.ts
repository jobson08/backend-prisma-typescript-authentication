// src/controllers/tenant/pagamentos.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../../config/database';

export class PagamentosController {
async marcarComoPago(req: Request, res: Response) {
  try {
    const { pagamentoId } = req.params;
    const { metodo } = req.body || {};

    console.log(`[MARCAR PAGO] Tentando atualizar ID: ${pagamentoId}`);

    // Declara fora para usar em qualquer bloco
    let pagamento: any = null;
    let modalidade: 'futebol' | 'crossfit' | null = null;

    // 1. Tenta encontrar em Futebol
    pagamento = await prisma.mensalidadeFutebol.findUnique({
      where: { id: pagamentoId },
    });

    if (pagamento) {
      modalidade = 'futebol';
      console.log(`[MARCAR PAGO] Encontrado em FUTEBOL - status atual: ${pagamento.status}`);
    }

    // 2. Se não encontrou, tenta em CrossFit
    if (!pagamento) {
      pagamento = await prisma.mensalidadeCrossfit.findUnique({
        where: { id: pagamentoId },
      });

      if (pagamento) {
        modalidade = 'crossfit';
        console.log(`[MARCAR PAGO] Encontrado em CROSSFIT - status atual: ${pagamento.status}`);
      }
    }

    if (!pagamento) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    // Agora pagamento existe e modalidade está definida
    if (pagamento.status === 'pago') {
      return res.status(400).json({ error: 'Pagamento já está marcado como pago' });
    }

    // Atualiza o status
    if (modalidade === 'futebol') {
      await prisma.mensalidadeFutebol.update({
        where: { id: pagamentoId },
        data: {
          status: 'pago',
          dataPagamento: new Date(),
          metodoPagamento: metodo || 'DINHEIRO',
        },
      });
      console.log(`[MARCAR PAGO] Atualizado FUTEBOL ID ${pagamentoId} para pago`);
    } else if (modalidade === 'crossfit') {
      await prisma.mensalidadeCrossfit.update({
        where: { id: pagamentoId },
        data: {
          status: 'pago',
          dataPagamento: new Date(),
          metodoPagamento: metodo || 'DINHEIRO',
        },
      });
      console.log(`[MARCAR PAGO] Atualizado CROSSFIT ID ${pagamentoId} para pago`);
    }

    return res.status(200).json({
      success: true,
      message: 'Pagamento marcado como pago com sucesso',
      data: { id: pagamentoId, status: 'pago' },
    });
  } catch (error) {
    console.error('[MARCAR PAGO] Erro:', error);
    return res.status(500).json({ error: 'Erro ao marcar pagamento como pago' });
  }
}
}

export const pagamentosController = new PagamentosController();