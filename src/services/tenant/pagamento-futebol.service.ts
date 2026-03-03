// src/services/tenant/pagamentos-futebol.service.ts
import { ptBR } from 'date-fns/locale/pt-BR';
import { prisma } from '../../config/database';
import { format, startOfMonth, endOfMonth, startOfDay } from 'date-fns';

export class PagamentosFutebolService {
  /**
   * Cria uma mensalidade manual para um aluno específico
   */
  async createManual(alunoId: string, escolinhaId: string, data: any) {
    // Validação extra (se necessário)
    const mesInicio = startOfMonth(new Date(data.mesReferencia));
    const mesFim = endOfMonth(mesInicio);
    const dataVencimento = new Date(data.dataVencimento + 'T00:00:00');

    // Verifica aluno
    const aluno = await prisma.alunoFutebol.findFirst({
      where: { id: alunoId, escolinhaId },
      include: { escolinha: { select: { valorMensalidadeFutebol: true } } },
    });

    if (!aluno) {
      throw new Error('Aluno não encontrado ou não pertence à escolinha');
    }

    // Verifica duplicata
    const existente = await prisma.mensalidadeFutebol.findFirst({
      where: {
        alunoId,
        mesReferencia: { gte: mesInicio, lt: mesFim },
      },
    });

    if (existente) {
      throw new Error('Já existe mensalidade para este mês');
    }

    // Valor da escolinha
    const valor = aluno.escolinha?.valorMensalidadeFutebol ?? 90.00;

    const mensalidade = await prisma.mensalidadeFutebol.create({
      data: {
        alunoId,
        escolinhaId,
        mesReferencia: mesInicio,
        valor,
        dataVencimento,
        status: 'PENDENTE',
        metodoPagamento: null,
        observacao: data.observacao,
      },
    });

    return mensalidade;
  }

  /**
   * Geração automática de mensalidades para todos alunos ativos (cron job)
   */
async generateAutomatic(escolinhaId: string, mesReferencia?: string) {
  try {
    // 1. Define o mês de referência (declarado aqui, escopo correto)
    let mesReferenciaStr = mesReferencia;
    if (!mesReferenciaStr) {
      const hoje = new Date();
      mesReferenciaStr = format(hoje, "yyyy-MM") + "-01";
    }

    // 2. Converte para Date (declarado aqui)
    const mes = new Date(mesReferenciaStr);
    if (isNaN(mes.getTime())) {
      throw new Error('Formato de mesReferencia inválido (use yyyy-MM-dd)');
    }

    mes.setDate(1);
    mes.setHours(0, 0, 0, 0);

    const mesFim = new Date(mes);
    mesFim.setMonth(mesFim.getMonth() + 1);

    console.log(`[CRON MENSALIDADE FUTEBOL] Processando mês: ${format(mes, 'MMMM yyyy', { locale: ptBR })}`);

    // 3. Busca alunos (declarado aqui)
    const alunos = await prisma.alunoFutebol.findMany({
      where: {
        status: 'ativo',
        escolinhaId,
      },
      include: {
        escolinha: {
          select: { valorMensalidadeFutebol: true },
        },
      },
    });

    if (alunos.length === 0) {
      return { 
        success: true, 
        message: 'Nenhum aluno ativo encontrado para geração automática' 
      };
    }

    console.log(`[CRON] Encontrados ${alunos.length} alunos ativos`);

    const created: any[] = [];
    const skipped: string[] = [];  // tipado explicitamente para evitar o erro
    const errors: string[] = [];

    // 4. Transação: usa as variáveis declaradas fora (alunos, mes, mesFim)
    await prisma.$transaction(async (tx) => {
      for (const aluno of alunos) {
        try {
          const existente = await tx.mensalidadeFutebol.findFirst({
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

          const valor = aluno.escolinha?.valorMensalidadeFutebol ?? 90.00;

          const mensalidade = await tx.mensalidadeFutebol.create({
            data: {
              alunoId: aluno.id,
              escolinhaId,
              mesReferencia: mes,
              valor,
              dataVencimento: new Date(mes.getFullYear(), mes.getMonth(), 10),
              status: 'PENDENTE',
            },
          });

          created.push(mensalidade);
          console.log(`[CRON] Mensalidade criada para ${aluno.nome} - ID: ${mensalidade.id}`);
        } catch (err: any) {
          console.error(`[CRON] Erro ao processar aluno ${aluno.nome}:`, err);
          errors.push(`Aluno ${aluno.nome}: ${err.message}`);
        }
      }
    });

    return {
      success: true,
      message: `Processamento concluído: ${created.length} mensalidades criadas, ${skipped.length} puladas, ${errors.length} erros`,
      createdCount: created.length,
      skipped,
      errors,
    };
  } catch (error: any) {
    console.error('[CRON GERAR MENSALIDADES FUTEBOL] Erro fatal:', error);
    return { error: 'Erro na geração automática', details: error.message };
  }
}

  /**
   * Lista histórico de mensalidades de um aluno
   */
  async listByAluno(alunoId: string, escolinhaId: string) {
    const aluno = await prisma.alunoFutebol.findFirst({
      where: { id: alunoId, escolinhaId },
    });

    if (!aluno) {
      throw new Error('Aluno não encontrado ou não pertence à escolinha');
    }

    const pagamentos = await prisma.mensalidadeFutebol.findMany({
      where: { alunoId },
      orderBy: { mesReferencia: 'desc' },
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

    return pagamentos;
  }

  /**
 * Deleta uma mensalidade específica (pagamento) de um aluno de futebol
 * - Verifica existência
 * - Verifica se pertence à escolinha do usuário autenticado
 * - Impede deleção se já foi pago (status PAGO) – opcional, ajuste conforme regra
 */
async deletePagamento(alunoId: string, pagamentoId: string, escolinhaId: string) {
  // Busca a mensalidade com include para verificar dono
  const pagamento = await prisma.mensalidadeFutebol.findFirst({
    where: {
      id: pagamentoId,
      alunoId,
    },
    include: {
      aluno: {
        select: { escolinhaId: true },
      },
    },
  });

  if (!pagamento) {
    throw new Error('Pagamento não encontrado ou não pertence ao aluno informado');
  }

  // Segurança: verifica se o pagamento pertence à escolinha do usuário logado
  if (pagamento.aluno.escolinhaId !== escolinhaId) {
    throw new Error('Pagamento não pertence à sua escolinha');
  }

  // Regra de negócio opcional: impede deletar pagamento já pago
  if (pagamento.status === 'PAGO' || pagamento.dataPagamento) {
    throw new Error('Não é permitido deletar pagamento já realizado');
  }

  // Deleta o registro
  await prisma.mensalidadeFutebol.delete({
    where: { id: pagamentoId },
  });

  return { success: true, message: 'Pagamento deletado com sucesso' };
}
}

