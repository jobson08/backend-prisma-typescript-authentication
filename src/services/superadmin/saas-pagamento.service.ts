// src/services/tenant/saas-pagamento.service.ts
import { MetodoPagamento } from '../../../generated/prisma';
import { prisma } from '../../config/database';

export class SaasPagamentoService {
  /**
   * Cria pagamento SaaS manual (somente superAdmin)
   */
  async createManual(
    escolinhaId: string,
    data: {
      valor: number;
      dataVencimento: Date;
      observacao?: string;
    }
  ) {
    try {
      // Verifica se a escolinha existe
      const escolinha = await prisma.escolinha.findUnique({
        where: { id: escolinhaId },
        select: { id: true, valorPlanoMensal: true },
      });

      if (!escolinha) {
        throw new Error('Escolinha não encontrada');
      }

      // Cria o pagamento com tipo 'saas'
      const pagamento = await prisma.pagamento.create({
        data: {
          escolinhaId,
          valor: data.valor,
          dataVencimento: data.dataVencimento,
          status: 'PENDENTE',
          tipo: 'saas',
          referenciaId: `saas-manual-${new Date().toISOString().slice(0, 10)}`,
          observacao: data.observacao || 'Cobrança SaaS manual gerada por superAdmin',
          // Se quiser linkar ao plano atual
          // planoSaaS: escolinha.planoSaaS (se o campo existir no model Escolinha)
        },
      });

      console.log(`[SAAS MANUAL] Criado pagamento ${pagamento.id} para escolinha ${escolinhaId}`);
      return pagamento;
    } catch (err: unknown) {
      console.error('[SAAS MANUAL SERVICE ERROR]', err);
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      throw new Error(`Falha ao criar pagamento manual SaaS: ${message}`);
    }
  }
  /**
   * Geração automática de pagamentos SaaS (chamada por cron)
   * Roda para todas as escolinhas ativas
   */
  async generateAutomatic() {
    try {
      const mesAtual = new Date();
      mesAtual.setDate(1);
      mesAtual.setHours(0, 0, 0, 0);

      const mesFim = new Date(mesAtual);
      mesFim.setMonth(mesFim.getMonth() + 1);

      console.log(`[SAAS AUTO] Iniciando geração para mês ${mesAtual.toISOString().slice(0,7)}`);

      const escolinhas = await prisma.escolinha.findMany({
        select: {
          id: true,
          valorPlanoMensal: true,
          planoSaaS: true,
        },
      });

      const criadas: any[] = [];
      const puladas: string[] = [];

      for (const esc of escolinhas) {
        if (!esc.valorPlanoMensal || esc.valorPlanoMensal <= 0) {
          puladas.push(esc.id);
          continue;
        }

        const existe = await prisma.pagamento.findFirst({
          where: {
            escolinhaId: esc.id,
            tipo: 'saas',
            dataVencimento: {
              gte: mesAtual,
              lt: mesFim,
            },
          },
        });

        if (existe) {
          puladas.push(esc.id);
          continue;
        }

        const pagamento = await prisma.pagamento.create({
          data: {
            escolinhaId: esc.id,
            valor: esc.valorPlanoMensal,
            dataVencimento: new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 10),
            status: 'PENDENTE',
            tipo: 'saas',
            referenciaId: `saas-auto-${mesAtual.toISOString().slice(0,7)}`,
            observacao: 'Cobrança mensal automática SaaS',
            planoSaaS: esc.planoSaaS || 'basico', // se existir o campo no Escolinha
          },
        });

        criadas.push(pagamento);
      }

      console.log(`[SAAS AUTO] Concluído: ${criadas.length} criadas | ${puladas.length} puladas`);
      return { criadas, puladas };
    } catch (err: unknown) {
      console.error('[SAAS AUTO ERROR]', err);
      throw new Error('Falha na geração automática de pagamentos SaaS');
    }
  }
//registrar pagamento manual na pagina pagamneto
async marcarComoPago(
  pagamentoId: string,
  dataPagamento?: Date,
  metodo: MetodoPagamento = MetodoPagamento.DINHEIRO
//atualizadoPorId?: string  // ← NOVO parâmetro
) {
  try {
    const pagamento = await prisma.pagamento.findUnique({
      where: { id: pagamentoId },
    });

    if (!pagamento) {
      throw new Error('Pagamento não encontrado');
    }

    // Correção do erro de comparação
    if (pagamento.status === 'CONFIRMADO') {  // ajuste se for outro valor do enum
      throw new Error('Pagamento já está marcado como pago');
    }

    const updated = await prisma.pagamento.update({
      where: { id: pagamentoId },
      data: {
        status: 'CONFIRMADO',  // ou 'PAGO' se você adicionar no enum
        dataPagamento: dataPagamento || new Date(),
        metodo,  // agora compatível com enum
        //atualizadoPorId,  // ← salva quem marcou
      },
    });

    console.log(`[PAGAMENTO MARCADO COMO PAGO] ID: ${pagamentoId} | Método: ${metodo}`);
    return updated;
  } catch (err: unknown) {
    console.error('[MARCAR PAGO SERVICE ERROR]', err);
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    throw new Error(message);
  }
}

}

export const saasPagamentoService = new SaasPagamentoService();