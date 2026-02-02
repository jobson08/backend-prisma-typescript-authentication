// src/services/tenant/dashboard-tenant.service.ts
import { prisma } from '../../config/database';

export class DashboardTenantService {
async getDashboard(escolinhaId: string, mes?: string) {
  console.log(`[DASHBOARD SERVICE START] escolinhaId: ${escolinhaId} | mes: ${mes || 'não informado'}`);

  try {
    const hoje = new Date();
    const mesAtual = mes || `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    console.log(`[DASHBOARD] Mês processado: ${mesAtual}`);

    // Total alunos
    console.log('[DASHBOARD] Contando totalAlunosFutebol...');
    const totalAlunosFutebol = await prisma.alunoFutebol.count({ where: { escolinhaId } });
    console.log('[DASHBOARD] totalAlunosFutebol:', totalAlunosFutebol);

    console.log('[DASHBOARD] Contando totalAlunosCrossfit...');
    const totalAlunosCrossfit = await prisma.alunoCrossfit.count({ where: { escolinhaId } });
    console.log('[DASHBOARD] totalAlunosCrossfit:', totalAlunosCrossfit);

    const totalAlunos = totalAlunosFutebol + totalAlunosCrossfit;

    // Busca escolinha
    console.log('[DASHBOARD] Buscando escolinha...');
    const escolinha = await prisma.escolinha.findUnique({
      where: { id: escolinhaId },
      select: {
        planoSaaS: true,
        valorPlanoMensal: true,
        statusPagamentoSaaS: true,
        dataProximoCobranca: true,
      },
    });
    console.log('[DASHBOARD] Escolinha encontrada:', !!escolinha);

    if (!escolinha) {
      throw new Error("Escolinha não encontrada");
    }

    // Receita mensal (aqui provavelmente quebra)
    console.log('[DASHBOARD] Calculando mensalidadeFutebolSum...');
    const mensalidadeFutebolSum = await prisma.mensalidadeFutebol.aggregate({
      where: { aluno: { escolinhaId } },
      _sum: { valor: true },
    });
    console.log('[DASHBOARD] mensalidadeFutebolSum:', mensalidadeFutebolSum);

    console.log('[DASHBOARD] Calculando mensalidadeCrossfitSum...');
    const mensalidadeCrossfitSum = await prisma.mensalidadeCrossfit.aggregate({
      where: { cliente: { escolinhaId } },
      _sum: { valor: true },
    });
    console.log('[DASHBOARD] mensalidadeCrossfitSum:', mensalidadeCrossfitSum);

      const receitaMensal = 
        (mensalidadeFutebolSum._sum?.valor ?? 0) +
        (mensalidadeCrossfitSum._sum?.valor ?? 0);

      // Aulas hoje (exemplo – ajuste para sua tabela real de treinos/presenças)
      const aulasHoje = await prisma.treino.count({
        where: {
          escolinhaId,
          data: {
            gte: hoje,
            lt: new Date(hoje.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      });

      // Pagamentos pendentes (do mês ou gerais – ajuste conforme necessidade)
      const pagamentosPendentes = await prisma.mensalidadeCrossfit.count({
        where: {
          cliente: { escolinhaId },
          status: { in: ['pendente', 'atrasado'] },
          dataVencimento: { lte: hoje },
        },
      });

      return { /* seus dados */ };
  } catch (err: unknown) {
    console.error('[DASHBOARD SERVICE CRASH]', err);
    const message = err instanceof Error ? err.message : String(err);
    console.error('[DASHBOARD SERVICE STACK]', err instanceof Error ? err.stack : 'Sem stack');
    throw err; // relança para o controller logar
  }
  }
}