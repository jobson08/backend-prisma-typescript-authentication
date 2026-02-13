// src/services/tenant/dashboard-tenant.service.ts
import { prisma } from '../../config/database';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
    console.log(`[DASHBOARD] Iniciando - escolinhaId: ${escolinhaId} | mes: ${mes || 'atual'}`);

    try {
      const hoje = new Date();
      const mesReferencia = mes 
        ? `${mes}-01` 
        : `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`;

      const mesInicio = startOfMonth(new Date(mesReferencia));
      const mesFim = endOfMonth(mesInicio);

      // Total de alunos
      const totalAlunosFutebol = await prisma.alunoFutebol.count({ where: { escolinhaId } });
      const totalAlunosCrossfit = await prisma.alunoCrossfit.count({ where: { escolinhaId } });
      const totalAlunos = totalAlunosFutebol + totalAlunosCrossfit;

      // Alunos ativos
      const alunosAtivosFutebol = await prisma.alunoFutebol.count({
        where: { escolinhaId, status: 'ativo' },
      });
      const alunosAtivosCrossfit = await prisma.alunoCrossfit.count({
        where: { escolinhaId, status: 'ativo' },
      });
      const alunosAtivos = alunosAtivosFutebol + alunosAtivosCrossfit;

      // Receita do mês (somente pagos no período)
      const receitaFutebol = await prisma.mensalidadeFutebol.aggregate({
        where: {
          aluno: { escolinhaId },
          status: 'pago',
          dataPagamento: { gte: mesInicio, lte: mesFim },
        },
        _sum: { valor: true },
      });

      const receitaCrossfit = await prisma.mensalidadeCrossfit.aggregate({
        where: {
          cliente: { escolinhaId },
          status: 'pago',
          dataPagamento: { gte: mesInicio, lte: mesFim },
        },
        _sum: { valor: true },
      });

      const receitaMensal = 
        (receitaFutebol._sum?.valor ?? 0) + 
        (receitaCrossfit._sum?.valor ?? 0);

      // Aulas hoje (ajuste o model se necessário)
      const aulasHoje = await prisma.treino?.count?.({
        where: {
          escolinhaId,
          data: { gte: hoje, lt: addDays(hoje, 1) },
        },
      }) ?? 0;

      // Pagamentos pendentes (soma as duas modalidades)
      const pendentesFutebol = await prisma.mensalidadeFutebol.count({
        where: {
          aluno: { escolinhaId },
          status: { in: ['pendente', 'atrasado'] },
          dataVencimento: { lte: hoje },
        },
      });

      const pendentesCrossfit = await prisma.mensalidadeCrossfit.count({
        where: {
          cliente: { escolinhaId },
          status: { in: ['pendente', 'atrasado'] },
          dataVencimento: { lte: hoje },
        },
      });

      const pagamentosPendentes = pendentesFutebol + pendentesCrossfit;

      const result = {
        aulasHoje,
        totalAlunos,
        alunosAtivos,
        receitaMensalEstimada: receitaMensal,
        pagamentosPendentes,
        crescimentoMensal: "+14%", // ← futuro: calcular real
        ultimaAtualizacao: new Date().toLocaleString("pt-BR"),
      };

      console.log('[DASHBOARD] Retorno final:', result);
      return result;
    } catch (err: unknown) {
      console.error('[DASHBOARD ERROR]', err);
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

  //  console.log(`[INADIMPLENTES] Busca iniciada - escolinha: ${escolinhaId} | mês: ${mesReferencia}`);
   // console.log(`[INADIMPLENTES] Intervalo: ${mesInicio.toISOString()} a ${mesFim.toISOString()}`);
   // console.log(`[INADIMPLENTES] Data atual: ${hoje.toISOString()}`);

    // 1. FUTEBOL - filtro mais amplo para debug
    const futebol = await prisma.mensalidadeFutebol.findMany({
      where: {
        aluno: { escolinhaId },
        mesReferencia: { gte: mesInicio, lt: mesFim },
        OR: [
          { status: 'pendente' },
          { status: 'atrasado' },
          { dataVencimento: { lte: hoje } }, // ← inclui pendentes vencidos
        ],
      },
      include: {
        aluno: {
          select: { nome: true, responsavel: { select: { nome: true } } },
        },
      },
      orderBy: { dataVencimento: 'asc' },
    });

    //console.log(`[INADIMPLENTES] FUTEBOL - encontrados: ${futebol.length}`);
    if (futebol.length > 0) {
 //     console.log('[INADIMPLENTES] Exemplo FUTEBOL:', futebol[0]);
    } else {
   //   console.log('[INADIMPLENTES] Nenhum em FUTEBOL - verifique status/dataVencimento no banco');
    }

    // 2. CROSSFIT
    const crossfit = await prisma.mensalidadeCrossfit.findMany({
      where: {
        cliente: { escolinhaId },
        mesReferencia: { gte: mesInicio, lt: mesFim },
        OR: [
          { status: 'pendente' },
          { status: 'atrasado' },
          { dataVencimento: { lte: hoje } },
        ],
      },
      include: {
        cliente: { select: { nome: true } },
      },
      orderBy: { dataVencimento: 'asc' },
    });

   // console.log(`[INADIMPLENTES] CROSSFIT - encontrados: ${crossfit.length}`);

    // Monta o array final
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
//   console.error('[getAlunosInadimplentes ERROR]', err);
    throw err;
  }
}

async getAniversariantesSemana(escolinhaId: string): Promise<Aniversariante[]> {
  try {
    const hoje = new Date();

    // Agora as funções estão importadas → sem erro
    const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 }); // segunda-feira
    const fimSemana = endOfWeek(hoje, { weekStartsOn: 1 });

    const futebol = await prisma.alunoFutebol.findMany({
      where: {
        escolinhaId,
        dataNascimento: { gte: inicioSemana, lte: fimSemana },
      },
      select: { nome: true, dataNascimento: true },
      orderBy: { dataNascimento: 'asc' },
    });

    const crossfit = await prisma.alunoCrossfit.findMany({
      where: {
        escolinhaId,
        dataNascimento: { gte: inicioSemana, lte: fimSemana },
      },
      select: { nome: true, dataNascimento: true },
      orderBy: { dataNascimento: 'asc' },
    });

    const aniversariantes: Aniversariante[] = [
      ...futebol.map(a => ({
        nome: a.nome,
        idade: this.calcularIdade(a.dataNascimento),
        dataAniversario: format(a.dataNascimento, 'dd/MM', { locale: ptBR }),
        modalidade: 'futebol' as const,
      })),
      ...crossfit.map(a => ({
        nome: a.nome,
        idade: this.calcularIdade(a.dataNascimento),
        dataAniversario: format(a.dataNascimento, 'dd/MM', { locale: ptBR }),
        modalidade: 'crossfit' as const,
      })),
    ].sort((a, b) => a.dataAniversario.localeCompare(b.dataAniversario));

    return aniversariantes;
  } catch (err) {
    console.error('[getAniversariantesSemana ERROR]', err);
    throw err;
  }
}

  private calcularIdade(data: Date): number {
    const hoje = new Date();
    let idade = hoje.getFullYear() - data.getFullYear();
    const m = hoje.getMonth() - data.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < data.getDate())) {
      idade--;
    }
    return idade;
  }
}