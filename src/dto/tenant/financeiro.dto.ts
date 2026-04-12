// src/dto/tenant/financeiro.dto.ts
import { z } from 'zod';

export const FinanceiroMensalQuerySchema = z.object({
  mes: z.string({
    error: (issue) => {
      if (issue.input === undefined || issue.input === null) {
        return 'O mês é obrigatório';
      }
      return 'Formato inválido. Use yyyy-MM (ex: 2025-12)';
    },
  }).regex(/^\d{4}-\d{2}$/, {
    message: 'Formato inválido. Use yyyy-MM (ex: 2025-12)',
  }),
});

export const StatusMensalidadeSchema = z.object({
  name: z.string(),
  value: z.number(),
});

export const EvolucaoMensalSchema = z.object({
  mes: z.string(),
  receita: z.number(),
});

export const FinanceiroMensalResponseSchema = z.object({
  mes: z.string(),
  receitaReal: z.number(),
  metaReceita: z.number(),
  inadimplencia: z.number(),
  alunosPagantes: z.number(),
  alunosTotais: z.number(),
  statusMensalidades: z.array(StatusMensalidadeSchema),
  evolucaoMensal: z.array(EvolucaoMensalSchema),
});

// Tipos inferidos do Zod (muito útil!)
export type FinanceiroMensalQueryDto = z.infer<typeof FinanceiroMensalQuerySchema>;
export type FinanceiroMensalResponseDto = z.infer<typeof FinanceiroMensalResponseSchema>;