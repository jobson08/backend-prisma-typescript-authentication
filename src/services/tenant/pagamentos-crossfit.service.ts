// src/services/tenant/pagamentos-crossfit.service.ts
import { prisma } from '../../config/database';
import { format, startOfMonth, endOfMonth, startOfDay } from 'date-fns';
import { z } from 'zod';

const createManualSchema = z.object({
  mesReferencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD'),
  dataVencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD'),
  valor: z.number().positive('Valor deve ser maior que zero'),
  observacao: z.string().optional(),
});

export class PagamentosCrossfitService {
async createManual(alunoId: string, escolinhaId: string, input: unknown) {
    if (!alunoId) {
      throw new Error('alunoId é obrigatório');
    }

    const data = createManualSchema.parse(input);

    const mesInicio = startOfMonth(new Date(data.mesReferencia));
    const mesFim = endOfMonth(mesInicio);

    const dataVencimento = new Date(data.dataVencimento);
    dataVencimento.setHours(0, 0, 0, 0);

    // Busca aluno + valor da escolinha
    const aluno = await prisma.alunoCrossfit.findFirst({
      where: { id: alunoId, escolinhaId },
      include: {
        escolinha: { select: { valorMensalidadeCrossfit: true } },
      },
    });

    if (!aluno) {
      throw new Error('Aluno CrossFit não encontrado ou não pertence à escolinha');
    }

    const existente = await prisma.mensalidadeCrossfit.findFirst({
      where: {
        clienteId: alunoId,
        mesReferencia: { gte: mesInicio, lt: mesFim },
      },
    });

    if (existente) {
      throw new Error('Já existe mensalidade para este mês');
    }

    const valor = data.valor ?? aluno.escolinha?.valorMensalidadeCrossfit ?? 149.00;

    const mensalidade = await prisma.mensalidadeCrossfit.create({
      data: {
        cliente: {
          connect: { id: alunoId },   // ← correto
        },
        escolinha: {
          connect: { id: escolinhaId }, // ← correto
        },
        mesReferencia: mesInicio,
        valor,
        dataVencimento,
        status: 'pendente',
        metodoPagamento: null,
        observacao: data.observacao,
      },
    });

    return mensalidade;
  }
//----------------------pagamento aotomatico-----------------------------------------------
  async generateAutomatic(escolinhaId: string, mesReferencia?: string) {
    let mesRefStr = mesReferencia;
    if (!mesRefStr) {
      const hoje = new Date();
      mesRefStr = format(hoje, 'yyyy-MM') + '-01';
    }

    const mes = new Date(mesRefStr);
    if (isNaN(mes.getTime())) {
      throw new Error('Formato de mesReferencia inválido');
    }

    mes.setDate(1);
    mes.setHours(0, 0, 0, 0);

    const mesFim = endOfMonth(mes);

    const alunos = await prisma.alunoCrossfit.findMany({
      where: { status: 'ativo', escolinhaId },
      include: { escolinha: { select: { valorMensalidadeCrossfit: true } } },
    });

    if (alunos.length === 0) {
      return { success: true, message: 'Nenhum aluno CrossFit ativo encontrado' };
    }

    const created: any[] = [];
    const skipped: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const aluno of alunos) {
        const existente = await tx.mensalidadeCrossfit.findFirst({
          where: {
            clienteId: aluno.id,  // ← CORRETO
            mesReferencia: { gte: mes, lt: mesFim },
          },
        });

        if (existente) {
          skipped.push(aluno.nome);
          continue;
        }

        const valor = aluno.escolinha?.valorMensalidadeCrossfit ?? 149.00;

        const mensalidade = await tx.mensalidadeCrossfit.create({
          data: {
            clienteId: aluno.id,  // ← CORRETO
            escolinhaId,
            mesReferencia: mes,
            valor,
            dataVencimento: new Date(mes.getFullYear(), mes.getMonth(), 10),
            status: 'pendente',
          },
        });

        created.push(mensalidade);
      }
    });

    return {
      success: true,
      createdCount: created.length,
      skipped,
      message: `Mensalidades CrossFit: ${created.length} criadas, ${skipped.length} puladas`,
    };
  }

  //-------------------------------listar historico pagamento alunos por Id-------------------------------

  async listByAluno(alunoId: string, escolinhaId: string) {
    const aluno = await prisma.alunoCrossfit.findFirst({
      where: { id: alunoId, escolinhaId },
    });

    if (!aluno) {
      throw new Error('Aluno CrossFit não encontrado ou não pertence à escolinha');
    }

    const pagamentos = await prisma.mensalidadeCrossfit.findMany({
      where: { clienteId: alunoId },  // ← CORRETO
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
  /*
  //--------------------------------Excluir pagamento--------------------------------
  async deletePagamento(clienteId: string, pagamentoId: string, escolinhaId: string) {
  // Busca a mensalidade com include para verificar dono
  const pagamento = await prisma.mensalidadeCrossfit.findFirst({
    where: {
      id: pagamentoId,
      clienteId,
    },
    include: {
      cliente: {
        select: { escolinhaId: true },
      },
    },
  });

  if (!pagamento) {
    throw new Error('Pagamento não encontrado ou não pertence ao aluno informado');
  }

  // Segurança: verifica se o pagamento pertence à escolinha do usuário logado
  if (pagamento.cliente.escolinhaId !== escolinhaId) {
    throw new Error('Pagamento não pertence à sua escolinha');
  }

  // Regra de negócio opcional: impede deletar pagamento já pago
  if (pagamento.status === 'pago' || pagamento.dataPagamento) {
    throw new Error('Não é permitido deletar pagamento já realizado');
  }

  // Deleta o registro
  await prisma.mensalidadeFutebol.delete({
    where: { id: pagamentoId },
  });

  return { success: true, message: 'Pagamento deletado com sucesso' };
}*/
}

export const pagamentosCrossfitService = new PagamentosCrossfitService();