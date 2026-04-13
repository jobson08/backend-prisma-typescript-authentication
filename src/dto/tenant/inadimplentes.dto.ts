// src/dto/tenant/inadimplentes.dto.ts
import { z } from 'zod';

export const InadimplentesQuerySchema = z.object({
  ano: z
    .string({ error: "O ano é obrigatório" })
    .regex(/^\d{4}$/, "Formato inválido. Use yyyy (ex: 2025)"),
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
  modalidade: "futebol" | "crossfit";
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
    modalidade: z.enum(["futebol", "crossfit"]),
  })),
  total: z.number(),
  totalDevido: z.number(),
});

export type InadimplentesQueryDto = z.infer<typeof InadimplentesQuerySchema>;
export type InadimplentesResponse = z.infer<typeof InadimplentesResponseSchema>;