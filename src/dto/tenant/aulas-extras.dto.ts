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
  alunoId: z.string().uuid("ID do aluno obrigatório").optional(),
  funcionarioTreinadorId: z.string().uuid("ID do treinador obrigatório"),
});

export type CreateAulaExtraDTO = z.infer<typeof createAulaExtraSchema>;

// Atualização de aula extra
export const updateAulaExtraSchema = createAulaExtraSchema.partial().extend({
  id: z.string().uuid("ID da aula obrigatório"),
  status: z.enum(["agendada", "concluida", "cancelada", "reagendada"]).optional(),
});

export type UpdateAulaExtraDTO = z.infer<typeof updateAulaExtraSchema>;

// ID para getById e delete
export const aulaExtraIdSchema = z.object({
  id: z.string().uuid("ID da aula inválido"),
});