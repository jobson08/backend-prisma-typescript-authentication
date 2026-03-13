import { z } from "zod";

// Criação de inscrição (vincular aluno + professor a uma aula)
export const createAulaExtraAlunoSchema = z.object({
  aulaExtraId: z.string().uuid("ID da aula obrigatório"),
  alunoId: z.string().uuid("ID do aluno obrigatório"),
  funcionarioTreinadorId: z.string().uuid("ID do professor obrigatório"),
  dataAula: z.string().datetime("Data/hora inválida").optional(),
  status: z.enum(["inscrito", "pago", "concluido", "cancelado", "faltou"]).optional().default("inscrito"),
  observacao: z.string().optional(),
  pagamentoId: z.string().uuid("ID do pagamento").optional(),
});

export type CreateAulaExtraAlunoDTO = z.infer<typeof createAulaExtraAlunoSchema>;

// Atualização de inscrição existente
export const updateAulaExtraAlunoSchema = createAulaExtraAlunoSchema.partial().extend({
  id: z.string().uuid("ID da inscrição obrigatório"),
});

export type UpdateAulaExtraAlunoDTO = z.infer<typeof updateAulaExtraAlunoSchema>;

// Exclusão ou busca por ID
export const aulaExtraAlunoIdSchema = z.object({
  id: z.string().uuid("ID da inscrição inválido"),
});