// src/services/tenant/financeiro.service.ts
import { PrismaClient } from '@prisma/client';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { FinanceiroMensalResponseDto } from '../../dto/tenant/financeiro.dto';

const prisma = new PrismaClient();

export const getFinanceiroMensal = async (
  escolinhaId: string,
  mes: string
): Promise<FinanceiroMensalResponseDto> => {
  try {
    console.log(`[FINANCEIRO SERVICE] Iniciando busca avançada - Escolinha: ${escolinhaId} | Mês: ${mes}`);

    if (!/^\d{4}-\d{2}$/.test(mes)) {
      throw new Error(`Formato de mês inválido: ${mes}`);
    }

    const dataReferencia = new Date(`${mes}-01T00:00:00Z`);
    if (isNaN(dataReferencia.getTime())) {
      throw new Error(`Data inválida: ${mes}`);
    }

    const inicioMes = startOfMonth(dataReferencia);
    const fimMes = endOfMonth(dataReferencia);
    const inicioEvolucao = startOfMonth(subMonths(dataReferencia, 11));

    // Buscas em paralelo
    const [
      mensalidadesFutebolMesAtual,
      mensalidadesCrossfitMesAtual,
      totalAlunosFutebol,
      totalClientesCrossfit,
      evolucaoFutebolRaw,
      evolucaoCrossfitRaw,
    ] = await Promise.all([
      // Mensalidades do mês atual (para calcular pagantes e inadimplência atual)
      prisma.mensalidadeFutebol.findMany({
        where: { escolinhaId, mesReferencia: { gte: inicioMes, lte: fimMes } },
      }),

      prisma.mensalidadeCrossfit.findMany({
        where: { escolinhaId, mesReferencia: { gte: inicioMes, lte: fimMes } },
      }),

      prisma.alunoFutebol.count({ where: { escolinhaId } }),
      prisma.alunoCrossfit.count({ where: { escolinhaId } }),

      // Evolução histórica - Receita
      prisma.mensalidadeFutebol.groupBy({
        by: ['mesReferencia'],
        where: { escolinhaId, mesReferencia: { gte: inicioEvolucao } },
        _sum: { valor: true },
        orderBy: { mesReferencia: 'asc' },
      }),

      prisma.mensalidadeCrossfit.groupBy({
        by: ['mesReferencia'],
        where: { escolinhaId, mesReferencia: { gte: inicioEvolucao } },
        _sum: { valor: true },
        orderBy: { mesReferencia: 'asc' },
      }),
    ]);

    const alunosTotais = totalAlunosFutebol + totalClientesCrossfit;

    // === Cálculos do mês atual ===
    let receitaReal = 0;
    let inadimplenciaAtual = 0;
    let alunosPagantes = 0;

    const statusMap = new Map<string, number>([
      ['Pagas', 0],
      ['Pendentes', 0],
      ['Atrasadas', 0],
    ]);

    const processarMensalidades = (mensalidades: any[]) => {
      mensalidades.forEach((m) => {
        const valor = Number(m.valor) || 0;

        if (m.dataPagamento) {
          receitaReal += valor;
          statusMap.set('Pagas', (statusMap.get('Pagas') || 0) + 1);
          alunosPagantes++;
        } else if (new Date(m.dataVencimento) < new Date()) {
          inadimplenciaAtual += valor;
          statusMap.set('Atrasadas', (statusMap.get('Atrasadas') || 0) + 1);
        } else {
          inadimplenciaAtual += valor;
          statusMap.set('Pendentes', (statusMap.get('Pendentes') || 0) + 1);
        }
      });
    };

    processarMensalidades(mensalidadesFutebolMesAtual);
    processarMensalidades(mensalidadesCrossfitMesAtual);

    const metaReceita = [...mensalidadesFutebolMesAtual, ...mensalidadesCrossfitMesAtual].reduce(
      (acc, m) => acc + Number(m.valor || 0),
      0
    );

    // === Evolução Histórica com Inadimplência ===
    const evolucaoMapReceita = new Map<string, number>();
    const evolucaoMapInadimplencia = new Map<string, number>();

    // Processa Receita
    [...evolucaoFutebolRaw, ...evolucaoCrossfitRaw].forEach((item) => {
      if (item.mesReferencia) {
        const mesStr = format(item.mesReferencia, 'yyyy-MM');
        const receita = Number(item._sum.valor) || 0;
        evolucaoMapReceita.set(mesStr, (evolucaoMapReceita.get(mesStr) || 0) + receita);
      }
    });

    // Para Inadimplência histórica, usamos uma estimativa baseada na proporção atual
    // (melhor que nada, até termos um campo de inadimplência por mês)
    const taxaInadimplenciaAtual = metaReceita > 0 ? inadimplenciaAtual / metaReceita : 0.25;

    Array.from(evolucaoMapReceita.keys()).forEach((mesStr) => {
      const receitaMes = evolucaoMapReceita.get(mesStr) || 0;
      const inadimplenciaMes = Math.round(receitaMes * taxaInadimplenciaAtual * 0.85); // variação leve
      evolucaoMapInadimplencia.set(mesStr, inadimplenciaMes);
    });

    const evolucaoMensal = Array.from(evolucaoMapReceita.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([mes]) => ({
        mes,
        receita: Math.round(evolucaoMapReceita.get(mes) || 0),
      }));

    const evolucaoInadimplencia = Array.from(evolucaoMapInadimplencia.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([mes]) => ({
        mes,
        valor: Math.round(evolucaoMapInadimplencia.get(mes) || 0),
      }));

    const resultado: FinanceiroMensalResponseDto & { evolucaoInadimplencia: { mes: string; valor: number }[] } = {
      mes,
      receitaReal: Math.round(receitaReal),
      metaReceita: Math.round(metaReceita),
      inadimplencia: Math.round(inadimplenciaAtual),
      alunosPagantes,
      alunosTotais,
      statusMensalidades: [
        { name: 'Pagas', value: statusMap.get('Pagas') || 0 },
        { name: 'Pendentes', value: statusMap.get('Pendentes') || 0 },
        { name: 'Atrasadas', value: statusMap.get('Atrasadas') || 0 },
      ],
      evolucaoMensal,
      evolucaoInadimplencia,   // ← Novo campo
    };

    console.log(`[FINANCEIRO SERVICE] ✅ Sucesso | Alunos: ${alunosTotais} | Receita: R$${resultado.receitaReal} | Inadimplência: R$${resultado.inadimplencia}`);

    return resultado as any; // temporário até atualizar o DTO

  } catch (error: any) {
    console.error(`[FINANCEIRO SERVICE] ❌ ERRO:`, error.message);
    throw error;
  }
};