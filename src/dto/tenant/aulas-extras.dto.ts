// src/types/aula-extra.ts
import { z } from "zod";

// Criação de nova aula extra
export const createAulaExtraSchema = z.object({
  nome: z.string().min(3, "Nome da aula é obrigatório"),
  duracao: z.string().min(1, "Duração é obrigatória").refine(
    (val) => ["30 min", "45 min", "60 min", "90 min"].includes(val),
    { message: "Duração inválida" }
  ),
  valor: z.number().positive("Valor deve ser maior que zero"),
  descricao: z.string().optional(),
});

export type CreateAulaExtraDTO = z.infer<typeof createAulaExtraSchema>;

// Atualização de uma aula extra específica
export const updateAulaExtraSchema = createAulaExtraSchema.partial().extend({
 // id: z.string().uuid("ID da aula obrigatório"),
  nome: z.string().min(3, "Nome da aula obrigatório").optional(),
  valor: z.number().positive("Valor deve ser positivo").optional(),
  duracao: z.string().min(1, "Duração obrigatória").optional(),
  descricao: z.string().optional(),
  status: z.enum(["agendada", "ativa", "inativa", "arquivada"]).optional(),
});

export type UpdateAulaExtraDTO = z.infer<typeof updateAulaExtraSchema>;

// Atualização em massa (ativação + lista completa - opcional)
export const updateAulasExtrasConfigSchema = z.object({
  ativarAulasExtras: z.boolean(),
  aulas: z.array(createAulaExtraSchema).optional().default([]),
});

export type UpdateAulasExtrasConfigDTO = z.infer<typeof updateAulasExtrasConfigSchema>;

// ID para getById e delete
export const aulaExtraIdSchema = z.object({
  id: z.string().uuid("ID da aula inválido"),
});