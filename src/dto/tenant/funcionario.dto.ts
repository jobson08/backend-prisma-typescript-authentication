// src/dto/tenant/funcionario.dto.ts
import { z } from 'zod';

// Schema para criação de Funcionário (login obrigatório)
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
  observacoes: z.string().optional(),
  fotoUrl: z.string().url('URL da foto inválida').optional(),

  // Campos para login (obrigatórios na criação)
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const updateFuncionarioSchema = createFuncionarioSchema
  .omit({ email: true, password: true }) // remove email e password da atualização normal
  .partial()
  .extend({
    // Permite redefinir senha (opcional)
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),
  });

export type CreateFuncionarioDto = z.infer<typeof createFuncionarioSchema>;
export type UpdateFuncionarioDto = z.infer<typeof updateFuncionarioSchema>;