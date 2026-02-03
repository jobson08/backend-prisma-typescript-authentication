// src/controllers/tenant/saas-pagamento.controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { saasPagamentoService } from '../../services/superadmin/saas-pagamento.service';
import { CreatePagamentoSaaSDto } from '../../dto/superadmin/create-pagamento-saas.dto';


const createManualSchema = z.object({
  valor: z.number().positive('Valor deve ser positivo'),
  dataVencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD'),
  observacao: z.string().optional(),
});

export class SaasPagamentoController {
  // Criação manual (somente superAdmin)
 async createManual(req: Request, res: Response) {
    try {
      const { escolinhaId } = req.params;

      // Validação Zod
      const body = CreatePagamentoSaaSDto.parse(req.body);

      const pagamento = await saasPagamentoService.createManual(escolinhaId, {
        valor: body.valor,
        dataVencimento: new Date(body.dataVencimento),
        observacao: body.observacao,
      });

      res.status(201).json({
        success: true,
        message: 'Cobrança SaaS manual criada com sucesso',
        data: pagamento,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: error.issues.map(i => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        });
      }

      console.error('[SAAS PAGAMENTO CONTROLLER MANUAL]', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({ error: `Erro ao criar cobrança SaaS: ${message}` });
    }
  }

  // Endpoint para rodar automático manualmente (somente superAdmin, para testes)
  async triggerAutomatic(req: Request, res: Response) {
    try {
      const result = await saasPagamentoService.generateAutomatic();
      res.json({
        success: true,
        message: "Geração automática de cobranças SaaS executada",
        data: result,
      });
    } catch (error: any) {
      console.error('[SAAS AUTO CONTROLLER]', error);
      res.status(500).json({ error: "Erro na geração automática de cobranças SaaS" });
    }
  }
// marcar os pagamentos pende em pagina Pagamento
 async marcarPago(req: Request, res: Response) {
  try {
    const { pagamentoId } = req.params;
    const { dataPagamento, metodo } = req.body;

    // Correção: use o service correto que tem o método marcarComoPago
    const updated = await saasPagamentoService.marcarComoPago(
      pagamentoId,
      dataPagamento ? new Date(dataPagamento) : undefined,
      metodo || 'DINHEIRO',
      // // quem está logado
    );

    res.json({
      success: true,
      message: 'Pagamento marcado como pago',
      data: updated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(400).json({ error: message });
  }
}
}

export const saasPagamentoController = new SaasPagamentoController();