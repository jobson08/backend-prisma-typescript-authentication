import { z } from "zod";

export const DashboardTenantResponseSchema = z.object({
  totalAlunos: z.number(),
  alunosAtivos: z.number(),
  receitaMensalEstimada: z.number(),
  aulasHoje: z.number(),
  pagamentosPendentes: z.number(),
  crescimentoMensal: z.string().optional(),
  planoSaaS: z.enum(["basico", "pro", "enterprise"]),
  valorPlanoMensal: z.number(),
  proximoVencimentoSaaS: z.string().datetime().nullable(),
  statusPagamentoSaaS: z.enum(["ativo", "atrasado", "suspenso", "cancelado"]),
  ultimaAtualizacao: z.string(),
});