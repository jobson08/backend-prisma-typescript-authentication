// src/dto/tenant/inadimplentes.dto.ts
import { z } from 'zod';

export const InadimplentesQuerySchema = z.object({
  mes: z
    .string({ error: "O mês é obrigatório" })
    .regex(/^\d{4}-\d{2}$/, "Formato inválido. Use yyyy-MM (ex: 2025-12)"),
});

export interface Inadimplente {
  id: string;
  aluno: string;
  responsavel: string;
  telefone: string;
  email: string;
  valorDevido: number;
  mesesAtraso: number;
  ultimaMensalidade: string;
  alunoId: string;
  modalidade: "futebol" | "crossfit";   // ← Adicionado
}

export const InadimplentesResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.object({
    id: z.string(),
    aluno: z.string(),
    responsavel: z.string(),
    telefone: z.string(),
    email: z.string(),
    valorDevido: z.number(),
    mesesAtraso: z.number(),
    ultimaMensalidade: z.string(),
    alunoId: z.string(),
  })),
  total: z.number(),
  totalDevido: z.number(),
});

export type InadimplentesQueryDto = z.infer<typeof InadimplentesQuerySchema>;
export type InadimplentesResponse = z.infer<typeof InadimplentesResponseSchema>;