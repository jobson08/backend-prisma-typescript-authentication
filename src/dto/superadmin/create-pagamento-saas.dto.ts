// src/dto/tenant/create-pagamento-saas.dto.ts
import { z } from 'zod';

export const CreatePagamentoSaaSDto = z.object({
  valor: z
    .number()
    .positive({ message: 'Valor deve ser maior que zero' })
    .max(100000, { message: 'Valor muito alto (máximo R$ 100.000)' }),

  dataVencimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Formato esperado: YYYY-MM-DD' })
    .refine(
      (val) => !isNaN(new Date(val).getTime()),
      { message: 'Data de vencimento inválida' }
    ),

  observacao: z
    .string()
    .max(500, { message: 'Observação muito longa (máximo 500 caracteres)' })
    .optional(),
});

// Tipo inferido
export type CreatePagamentoSaaSDtoType = z.infer<typeof CreatePagamentoSaaSDto>;