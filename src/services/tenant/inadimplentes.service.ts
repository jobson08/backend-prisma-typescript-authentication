// src/services/tenant/inadimplentes.service.ts
import { PrismaClient } from '@prisma/client';
import { format, startOfYear, endOfYear } from 'date-fns';
import { Inadimplente } from '../../dto/tenant/inadimplentes.dto';

const prisma = new PrismaClient();

export const getInadimplentes = async (
  escolinhaId: string,
  ano: string
): Promise<Inadimplente[]> => {
  try {
    const anoNumber = parseInt(ano);
    if (isNaN(anoNumber)) {
      throw new Error(`Ano inválido: ${ano}`);
    }

    const inicioAno = startOfYear(new Date(anoNumber, 0, 1));
    const fimAno = endOfYear(new Date(anoNumber, 0, 1));

    console.log(`[INADIMPLENTES SERVICE] Buscando ano ${anoNumber} | De ${format(inicioAno, 'yyyy-MM-dd')} até ${format(fimAno, 'yyyy-MM-dd')}`);

    const [mensalidadesFutebol, mensalidadesCrossfit] = await Promise.all([
      prisma.mensalidadeFutebol.findMany({
        where: {
          escolinhaId,
          dataPagamento: null,
          mesReferencia: {   // ← Filtro principal por ano
            gte: inicioAno,
            lte: fimAno,
          },
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
          mesReferencia: {
            gte: inicioAno,
            lte: fimAno,
          },
        },
        include: {
          cliente: {
            select: {
              id: true,
              nome: true,
            }
          }
        }
      })
    ]);

    console.log(`[DEBUG] Mensalidades Futebol encontradas no ano: ${mensalidadesFutebol.length}`);
    console.log(`[DEBUG] Mensalidades CrossFit encontradas no ano: ${mensalidadesCrossfit.length}`);

    const inadimplentesMap = new Map<string, Inadimplente>();

    // Processa Futebol
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
          ultimaMensalidade: format(m.mesReferencia, 'MMM/yyyy'),
          alunoId: m.aluno.id,
          modalidade: "futebol",
        });
      }

      const item = inadimplentesMap.get(key)!;
      item.valorDevido += Number(m.valor);
      item.mesesAtraso += 1;
    });

    // Processa CrossFit
    mensalidadesCrossfit.forEach((m) => {
      const cliente = m.cliente;
      if (!cliente) return;

      const key = `c-${cliente.id}`;

      if (!inadimplentesMap.has(key)) {
        inadimplentesMap.set(key, {
          id: m.id,
          aluno: cliente.nome || "Cliente sem nome",
          responsavel: "Não informado",
          telefone: "",
          email: "",
          valorDevido: 0,
          mesesAtraso: 0,
          ultimaMensalidade: format(m.mesReferencia, 'MMM/yyyy'),
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

    console.log(`[INADIMPLENTES SERVICE] Total encontrado no ano ${ano}: ${resultado.length}`);

    return resultado;

  } catch (error) {
    console.error("[INADIMPLENTES SERVICE] Erro:", error);
    throw error;
  }
};