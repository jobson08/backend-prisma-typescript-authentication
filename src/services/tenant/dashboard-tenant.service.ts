// src/services/tenant/dashboard-tenant.service.ts
import { prisma } from '../../config/database';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

interface Inadimplente {
  id: string;
  alunoNome: string;
  responsavelNome: string | null;
  valorDevido: number;
  dataVencimento: string;
  status: string;
  alunoId: string;
  modalidade: 'futebol' | 'crossfit';
}

interface Aniversariante {
  nome: string;
  idade: number;
  dataAniversario: string;
  modalidade: 'futebol' | 'crossfit';
}

type MensalidadeFutebolWithAluno = {
  id: string;
  alunoId: string;
  valor: number;
  dataVencimento: Date;
  status: string;
  aluno: { nome: string; responsavel: { nome: string } | null };
};

type MensalidadeCrossfitWithCliente = {
  id: string;
  clienteId: string;
  valor: number;
  dataVencimento: Date;
  status: string;
  cliente: { nome: string };
};

export class DashboardTenantService {
async getDashboard(escolinhaId: string, mes?: string) {
  try {
    const hoje = new Date();

    // Mês de referência
    const mesReferenciaStr = mes 
      ? `${mes}-01` 
      : `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`;

    const mesInicio = startOfMonth(new Date(mesReferenciaStr));
    const mesFim = endOfMonth(mesInicio);

    // 1. Total de alunos
    const totalAlunosFutebol = await prisma.alunoFutebol.count({ where: { escolinhaId } });
    const totalAlunosCrossfit = await prisma.alunoCrossfit.count({ where: { escolinhaId } });
    const totalAlunos = totalAlunosFutebol + totalAlunosCrossfit;

    // 2. Alunos ativos
    const alunosAtivosFutebol = await prisma.alunoFutebol.count({
      where: { escolinhaId, status: 'ativo' },
    });
    const alunosAtivosCrossfit = await prisma.alunoCrossfit.count({
      where: { escolinhaId, status: 'ativo' },
    });
    const alunosAtivos = alunosAtivosFutebol + alunosAtivosCrossfit;

    // 3. Receita do mês (mensalidades pagas do mês atual)
    const receitaAtualFutebol = await prisma.mensalidadeFutebol.aggregate({
      where: {
        aluno: { escolinhaId },
        mesReferencia: { gte: mesInicio, lt: mesFim },
        status: 'pago',
      },
      _sum: { valor: true },
    });

    const receitaAtualCrossfit = await prisma.mensalidadeCrossfit.aggregate({
      where: {
        cliente: { escolinhaId },
        mesReferencia: { gte: mesInicio, lt: mesFim },
        status: 'pago',
      },
      _sum: { valor: true },
    });

    const receitaAtual = 
      (receitaAtualFutebol._sum?.valor ?? 0) + 
      (receitaAtualCrossfit._sum?.valor ?? 0);

      // Receita do mês anterior (para comparar)
        const mesAnterior = new Date(mesInicio);
        mesAnterior.setMonth(mesAnterior.getMonth() - 1);
        const mesInicioAnterior = startOfMonth(mesAnterior);
        const mesFimAnterior = endOfMonth(mesAnterior);

        const receitaAnteriorFutebol = await prisma.mensalidadeFutebol.aggregate({
          where: {
            aluno: { escolinhaId },
            mesReferencia: { gte: mesInicioAnterior, lt: mesFimAnterior },
            status: 'pago',
          },
          _sum: { valor: true },
        });

        const receitaAnteriorCrossfit = await prisma.mensalidadeCrossfit.aggregate({
          where: {
            cliente: { escolinhaId },
            mesReferencia: { gte: mesInicioAnterior, lt: mesFimAnterior },
            status: 'pago',
          },
          _sum: { valor: true },
        });

        const receitaAnterior = 
          (receitaAnteriorFutebol._sum?.valor ?? 0) + 
          (receitaAnteriorCrossfit._sum?.valor ?? 0);

        // Cálculo do crescimento mensal real
        let crescimentoMensal = "0%";

        if (receitaAtual > 0 || receitaAnterior > 0) {
          if (receitaAnterior === 0) {
            crescimentoMensal = "+100%"; // começou do zero
          } else {
            const diferenca = receitaAtual - receitaAnterior;
            const percentual = (diferenca / receitaAnterior) * 100;
            const sinal = percentual >= 0 ? "+" : "";
            crescimentoMensal = `${sinal}${Math.round(percentual)}%`;
          }
        }

    // 4. Aulas hoje
    const aulasHoje = await prisma.treino?.count?.({
      where: {
        escolinhaId,
        data: { gte: hoje, lt: addDays(hoje, 1) },
      },
    }) ?? 0;

    // 5. Pagamentos pendentes do mês atual
    const pendentesFutebol = await prisma.mensalidadeFutebol.count({
      where: {
        aluno: { escolinhaId },
        mesReferencia: { gte: mesInicio, lt: mesFim },
        status: { in: ['pendente', 'atrasado'] },
      },
    });

    const pendentesCrossfit = await prisma.mensalidadeCrossfit.count({
      where: {
        cliente: { escolinhaId },
        mesReferencia: { gte: mesInicio, lt: mesFim },
        status: { in: ['pendente', 'atrasado'] },
      },
    });

    const pagamentosPendentes = pendentesFutebol + pendentesCrossfit;

    

    // Resultado final com nomes EXPLÍCITOS (sem shorthand que dá erro)
    const dashboardData = {
      aulasHoje: aulasHoje,
      totalAlunos: totalAlunos,
      alunosAtivos: alunosAtivos,
      receitaMensalEstimada: receitaAtual,
      pagamentosPendentes: pagamentosPendentes,
      crescimentoMensal: crescimentoMensal,
      ultimaAtualizacao: new Date().toLocaleString("pt-BR"),
    };

    // console.log('[DASHBOARD] Retorno final:', dashboardData);
    return dashboardData;
  } catch (err: unknown) {
   // console.error('[DASHBOARD ERROR]', err);
    throw err;
  }
}

async getAlunosInadimplentes(escolinhaId: string, mes?: string): Promise<Inadimplente[]> {
  try {
    const hoje = new Date();
    const mesReferencia = mes 
      ? `${mes}-01` 
      : `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`;

    const mesInicio = startOfMonth(new Date(mesReferencia));
    const mesFim = endOfMonth(mesInicio);

   // console.log(`[INADIMPLENTES] Busca - escolinha: ${escolinhaId} | mês: ${mesReferencia}`);

    // FUTEBOL - filtro limpo: só pendente ou atrasado
    const futebol = await prisma.mensalidadeFutebol.findMany({
      where: {
        aluno: { escolinhaId },
        mesReferencia: { gte: mesInicio, lt: mesFim },
        status: { in: ['pendente', 'atrasado'] }, // ← só status, sem OR de dataVencimento
      },
      include: {
        aluno: {
          select: { nome: true, responsavel: { select: { nome: true } } },
        },
      },
      orderBy: { dataVencimento: 'asc' },
    });

   // console.log(`[INADIMPLENTES] FUTEBOL encontrados: ${futebol.length}`);

    // CROSSFIT - mesmo filtro limpo
    const crossfit = await prisma.mensalidadeCrossfit.findMany({
      where: {
        cliente: { escolinhaId },
        mesReferencia: { gte: mesInicio, lt: mesFim },
        status: { in: ['pendente', 'atrasado'] }, // ← removido o OR problemático
      },
      include: {
        cliente: { select: { nome: true } },
      },
      orderBy: { dataVencimento: 'asc' },
    });

   // console.log(`[INADIMPLENTES] CROSSFIT encontrados: ${crossfit.length}`);

    const inadimplentes: Inadimplente[] = [
      ...futebol.map(m => ({
        id: m.id,
        alunoNome: m.aluno.nome,
        responsavelNome: m.aluno.responsavel?.nome || null,
        valorDevido: m.valor,
        dataVencimento: m.dataVencimento.toISOString(),
        status: m.status,
        alunoId: m.alunoId,
        modalidade: 'futebol' as const,
      })),
      ...crossfit.map(m => ({
        id: m.id,
        alunoNome: m.cliente.nome,
        responsavelNome: null,
        valorDevido: m.valor,
        dataVencimento: m.dataVencimento.toISOString(),
        status: m.status,
        alunoId: m.clienteId,
        modalidade: 'crossfit' as const,
      })),
    ];

   // console.log(`[INADIMPLENTES] Total retornado: ${inadimplentes.length}`);

    return inadimplentes;
  } catch (err) {
   // console.error('[getAlunosInadimplentes ERROR]', err);
    throw err;
  }
}

// Aniversariante
async getAniversariantesSemana(escolinhaId: string, mes?: string): Promise<Aniversariante[]> {
  try {
    let baseDate = new Date();

    if (mes && typeof mes === 'string' && /^\d{4}-\d{2}$/.test(mes.trim())) {
      const mesTrim = mes.trim();
      const parsed = new Date(`${mesTrim}-01`);
      if (!isNaN(parsed.getTime())) {
        baseDate = parsed;
      } else {
        console.warn(`[ANIVERSARIANTES] Mês inválido (parse falhou): ${mesTrim}`);
      }
    }

    const mesInicio = startOfMonth(baseDate);
    const mesEsperado = mesInicio.getMonth() + 2; // 1 = janeiro, 2 = fevereiro, ... 12 = dezembro

    console.log(`[ANIVERSARIANTES] Filtrando mês inteiro: ${format(mesInicio, 'MMMM yyyy', { locale: ptBR })}`);
    console.log(`[DEBUG] Mês esperado (1-based): ${mesEsperado} (raw getMonth: ${mesInicio.getMonth()})`);

    const futebol = await prisma.alunoFutebol.findMany({
      where: { escolinhaId },
      select: { nome: true, dataNascimento: true },
    });

    const crossfit = await prisma.alunoCrossfit.findMany({
      where: { escolinhaId },
      select: { nome: true, dataNascimento: true },
    });

    const aniversariantes: Aniversariante[] = [];

    const isAniversarioNoMes = (dataNasc: Date | null) => {
      if (!dataNasc || isNaN(dataNasc.getTime())) return false;

      const mesNasc = dataNasc.getMonth() + 1;

      const passa = mesNasc === mesEsperado;

      console.log('[DEBUG ALUNO]', {
        dataBruta: dataNasc.toISOString(),
        mesNasc,
        mesEsperado,
        passa
      });

      return passa;
    };

    futebol.forEach(a => {
      if (a.dataNascimento && isAniversarioNoMes(a.dataNascimento)) {
        aniversariantes.push({
          nome: a.nome || "Sem nome",
          idade: this.calcularIdade(a.dataNascimento),
          dataAniversario: this.formatDiaMes(a.dataNascimento),
          modalidade: 'futebol' as const,
        });
      }
    });

    crossfit.forEach(a => {
      if (a.dataNascimento && isAniversarioNoMes(a.dataNascimento)) {
        aniversariantes.push({
          nome: a.nome || "Sem nome",
          idade: this.calcularIdade(a.dataNascimento),
          dataAniversario: this.formatDiaMes(a.dataNascimento),
          modalidade: 'crossfit' as const,
        });
      }
    });

    aniversariantes.sort((a, b) => a.dataAniversario.localeCompare(b.dataAniversario));

    console.log(`[ANIVERSARIANTES] Total encontrados no mês: ${aniversariantes.length}`);

    return aniversariantes;
  } catch (err) {
    //console.error('[getAniversariantesSemana ERROR FULL]', err);
    //console.error('[STACK]', err.stack || 'Sem stack trace');
    throw err;
  }
}

// Funções auxiliares (adicione se ainda não tiver)

private formatDiaMes(date: Date): string {
  if (!date || isNaN(date.getTime())) return "—";
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}`;
}

private calcularIdade(data: Date): number {
  if (!data || isNaN(data.getTime())) return 0;
  const hoje = new Date();
  let idade = hoje.getFullYear() - data.getFullYear();
  const m = hoje.getMonth() - data.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < data.getDate())) {
    idade--;
  }
  return idade;
}

}