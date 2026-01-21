import { z } from 'zod';

// Criação
export const createFuncionarioSchema = z.object({
  nome: z.string().min(3, 'Nome completo obrigatório'),
  cargo: z.enum([
    'PROFESSOR',
    'RECEPCAO',
    'ADMINISTRATIVO',
    'TREINADOR',
    'GERENTE',
  ], { message: 'Cargo inválido' }),
  salario: z.number().positive('Salário deve ser positivo').optional(),
  telefone: z.string().min(10, 'Telefone inválido').optional(),
  email: z.string().email('E-mail inválido').optional(),
  observacoes: z.string().optional(),
});

// Atualização (parcial)
export const updateFuncionarioSchema = createFuncionarioSchema.partial();

export type CreateFuncionarioDto = z.infer<typeof createFuncionarioSchema>;
export type UpdateFuncionarioDto = z.infer<typeof updateFuncionarioSchema>;