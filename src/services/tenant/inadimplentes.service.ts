// src/services/tenant/inadimplentes.service.ts
import { PrismaClient } from '@prisma/client';
import { format, endOfMonth } from 'date-fns';
import { Inadimplente } from '../../dto/tenant/inadimplentes.dto';

const prisma = new PrismaClient();

export const getInadimplentes = async (
  escolinhaId: string,
  mes: string
): Promise<Inadimplente[]> => {
  try {
    console.log(`[INADIMPLENTES SERVICE] Buscando para escolinha: ${escolinhaId} | Mês: ${mes}`);

    const dataReferencia = new Date(`${mes}-01T00:00:00Z`);
    const fimMesAtual = endOfMonth(dataReferencia);

    // Busca mensalidades não pagas
    const [mensalidadesFutebol, mensalidadesCrossfit] = await Promise.all([
      prisma.mensalidadeFutebol.findMany({
        where: {
          escolinhaId,
          dataPagamento: null,
        },
        include: {
          aluno: {
            select: {
              id: true,
              nome: true,
              responsavel: {
                select: { nome: true, telefone: true, email: true }
              }
            }
          }
        }
      }),

      prisma.mensalidadeCrossfit.findMany({
        where: {
          escolinhaId,
          dataPagamento: null,
        },
        include: {
          cliente: {
            select: {
              id: true,
              nome: true,
              // Como não tem responsavel, pegamos apenas o que existe
            }
          }
        }
      })
    ]);

    const inadimplentesMap = new Map<string, Inadimplente>();

    // === Processa Mensalidades de Futebol ===
    mensalidadesFutebol.forEach((m) => {
      const key = `f-${m.aluno.id}`;

      if (!inadimplentesMap.has(key)) {
        inadimplentesMap.set(key, {
          id: m.id,
          aluno: m.aluno.nome,
          responsavel: m.aluno.responsavel?.nome || "Não informado",
          telefone: m.aluno.responsavel?.telefone || "",
          email: m.aluno.responsavel?.email || "",
          valorDevido: 0,
          mesesAtraso: 0,
          ultimaMensalidade: format(m.dataVencimento, 'MMM/yyyy'),
          alunoId: m.aluno.id,
          modalidade: "futebol",           // ← Modalidade adicionada
        });
      }

      const item = inadimplentesMap.get(key)!;
      item.valorDevido += Number(m.valor);
      item.mesesAtraso += 1;
    });

    // === Processa Mensalidades de CrossFit ===
    mensalidadesCrossfit.forEach((m) => {
      const cliente = m.cliente;
      if (!cliente) return;

      const key = `c-${cliente.id}`;

      if (!inadimplentesMap.has(key)) {
        inadimplentesMap.set(key, {
          id: m.id,
          aluno: cliente.nome || "Cliente sem nome",
          responsavel: "Não informado",           // CrossFit não tem responsavel
          telefone: "",                           // não existe no model
          email: "",                              // não existe no model
          valorDevido: 0,
          mesesAtraso: 0,
          ultimaMensalidade: format(m.dataVencimento, 'MMM/yyyy'),
          alunoId: cliente.id,
          modalidade: "crossfit",
        });
      }

      const item = inadimplentesMap.get(key)!;
      item.valorDevido += Number(m.valor);
      item.mesesAtraso += 1;
    });

    const resultado = Array.from(inadimplentesMap.values())
      .sort((a, b) => b.valorDevido - a.valorDevido);

    console.log(`[INADIMPLENTES SERVICE] Encontrados ${resultado.length} inadimplentes`);
    console.log(`[DEBUG] Futebol: ${mensalidadesFutebol.length} | CrossFit: ${mensalidadesCrossfit.length}`);

    return resultado;

  } catch (error) {
    console.error("[INADIMPLENTES SERVICE] Erro:", error);
    throw error;
  }
};