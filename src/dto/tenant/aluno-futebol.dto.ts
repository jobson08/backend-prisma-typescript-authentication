import { z } from "zod";

export const createAlunoFutebolSchema = z.object({
  nome: z.string().min(3, "Nome completo é obrigatório"),

  dataNascimento: z.string().refine(
    (val) => {
      // Aceita ISO ou dd/mm/yyyy
      return (
        /^\d{4}-\d{2}-\d{2}$/.test(val) ||
        /^\d{2}\/\d{2}\/\d{4}$/.test(val)
      );
    },
    { message: "Data de nascimento inválida (use dd/mm/yyyy ou YYYY-MM-DD)" }
  ),

  telefone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos").optional(),

  cpf: z.string().regex(/^\d{11}$/, "CPF deve ter exatamente 11 dígitos").optional(),

  categoria: z.string().min(1, "Categoria é obrigatória"),

  responsavelId: z.string() .nullable() .optional(),

  email: z.string().email("E-mail inválido"),

  // Status opcional no DTO (backend força "ativo")
  status: z.enum(["ATIVO", "INATIVO", "TRANCADO"]).optional(),

  observacoes: z.string().optional(),
  // Opcional: password se quiser permitir envio manual
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional(),
});

export const updateAlunoFutebolSchema = z.object({
  nome: z.string().min(3, "Nome completo é obrigatório").optional(),
  dataNascimento: z.string().optional(),
  telefone: z.string().min(10, "Telefone inválido").optional(),
  cpf: z.string().regex(/^\d{11}$/, "CPF deve ter exatamente 11 dígitos").optional(),
  categoria: z.string().min(1, "Categoria é obrigatória").optional(),
  responsavelId: z.string().nullable().optional(),
  email: z.string().email("E-mail inválido").optional(),
  observacoes: z.string().optional(),
  status: z.enum(["ATIVO", "INATIVO", "TRANCADO"]).optional(),

// Opcional: password se quiser permitir envio manual
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional(),
});

export type CreateAlunoFutebolDto = z.infer<typeof createAlunoFutebolSchema>;
export type UpdateAlunoFutebolDto = z.infer<typeof updateAlunoFutebolSchema>;