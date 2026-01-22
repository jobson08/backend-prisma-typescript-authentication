import { z } from 'zod';

// Criação
export const createAlunoSchema = z.object({
  nome: z.string().min(3, 'Nome completo obrigatório'),
 // Obrigatório + mensagem customizada usando .refine()
  dataNascimento: z.date().refine(
    (date) => !isNaN(date.getTime()),
    { message: "Data de nascimento é obrigatória e deve ser válida" }
  ),
  telefone: z.string().min(10, 'Telefone inválido').optional(),
  cpf: z.string().optional(),
  categoria: z.string().min(1, 'Categoria obrigatória'),
  responsavelId: z.string().optional(),
  status: z.enum(['ATIVO', 'INATIVO', 'TRANCADO']).default('ATIVO'),
  observacoes: z.string().optional(),
  // Opcional: se criar login para o aluno
  email: z.string().email('E-mail inválido').optional(),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),
});

// Atualização (todos opcionais)
export const updateAlunoSchema = createAlunoSchema.partial();

export type CreateAlunoDto = z.infer<typeof createAlunoSchema>;
export type UpdateAlunoDto = z.infer<typeof updateAlunoSchema>;