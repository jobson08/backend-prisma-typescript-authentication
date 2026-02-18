import { z } from "zod";

export const createTreinoSchema = z.object({
  nome: z.string().min(3, "Nome do treino obrigatório"),
  descricao: z.string().optional(),
  data: z.string().refine(val => /^\d{4}-\d{2}-\d{2}$/.test(val), "Data deve ser YYYY-MM-DD"),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, "Hora início inválida (HH:mm)"),
  horaFim: z.string().regex(/^\d{2}:\d{2}$/, "Hora fim inválida (HH:mm)"),
  categoria: z.string().min(1, "Categoria obrigatória"),
  local: z.string().min(1, "Local obrigatório"),
  funcionarioTreinadorId: z.string().min(1, "Treinador obrigatório"), // remova .uuid() se não for UUID real
  // Se quiser limite de alunos no futuro
  // alunosMax: z.number().min(1).max(50).optional(),
});

export type CreateTreinoDTO = z.infer<typeof createTreinoSchema>;

export const updateTreinoSchema = createTreinoSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateTreinoDTO = z.infer<typeof updateTreinoSchema>;