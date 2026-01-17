// src/services/dashboard-tenant.service.ts
import { prisma } from '../config/database';

export class DashboardTenantService {
  async getDashboard(escolinhaId: string, mes?: string) {
    const hoje = new Date();
    const mesAtual = mes || `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

    // Total alunos
    const totalAlunosFutebol = await prisma.alunoFutebol.count({ where: { escolinhaId } });
    const totalAlunosCrossfit = await prisma.clienteCrossfit.count({ where: { escolinhaId } });
    const totalAlunos = totalAlunosFutebol + totalAlunosCrossfit;

    // Busca a escolinha (uma única vez)
    const escolinha = await prisma.escolinha.findUnique({
      where: { id: escolinhaId },
      select: {
        planoSaaS: true,
        valorPlanoMensal: true,
        statusPagamentoSaaS: true,
        dataProximoCobranca: true,
      },
    });

    if (!escolinha) {
      throw new Error("Escolinha não encontrada");
    }

    // Receita mensal REAL da escolinha (apenas mensalidades dos alunos)
  const mensalidadeFutebolSum = await prisma.mensalidadeFutebol.aggregate({
    where: { aluno: { escolinhaId } },
    _sum: { valor: true },
  });

  const mensalidadeCrossfitSum = await prisma.mensalidadeCrossfit.aggregate({
    where: { cliente: { escolinhaId } },
    _sum: { valor: true },
  });

  // Se tiver aulas extras pagas, adicione aqui no futuro
  const receitaMensal = 
    (mensalidadeFutebolSum._sum?.valor ?? 0) +
    (mensalidadeCrossfitSum._sum?.valor ?? 0);

    // Aulas hoje
    const aulasHoje = await prisma.treino.count({
      where: {
        escolinhaId,
        data: { gte: hoje, lt: new Date(hoje.setDate(hoje.getDate() + 1)) },
      },
    });

    // Pagamentos pendentes
    const pagamentosPendentes = await prisma.pagamento.count({
      where: {
        escolinhaId,
        status: 'PENDENTE',
        dataVencimento: { lte: hoje },
      },
    });

    return {
    totalAlunos,
    alunosAtivos: totalAlunos, // ajuste com lógica real depois
    receitaMensalEstimada: receitaMensal, // AGORA É SÓ DOS ALUNOS!
    aulasHoje,
    pagamentosPendentes,
    crescimentoMensal: "+14%", // calcule real depois
    planoSaaS: escolinha.planoSaaS || "basico",
    valorPlanoMensal: escolinha.valorPlanoMensal || 0,
    proximoVencimentoSaaS: escolinha.dataProximoCobranca?.toISOString() || null,
    statusPagamentoSaaS: escolinha.statusPagamentoSaaS || "ativo",
    ultimaAtualizacao: new Date().toLocaleString("pt-BR"),
    };
  }
}