import { z } from 'zod';

// Criação (agora inclui login obrigatório)
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
  email: z.string().email('E-mail inválido'), // ← obrigatório para login
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'), // ← obrigatório
  observacoes: z.string().optional(),
});

// Atualização (parcial - não muda senha/email aqui, ou crie rota separada)
export const updateFuncionarioSchema = createFuncionarioSchema
  .omit({ password: true }) // remove password da atualização
  .partial();

export type CreateFuncionarioDto = z.infer<typeof createFuncionarioSchema>;
export type UpdateFuncionarioDto = z.infer<typeof updateFuncionarioSchema>;