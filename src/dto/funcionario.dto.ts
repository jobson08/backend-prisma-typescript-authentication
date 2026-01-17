import { z } from 'zod';

export const createFuncionarioSchema = z.object({
  nome: z.string().min(3, 'Nome completo obrigatório'),
  cargo: z.enum([
    'PROFESSOR',
    'RECEPCAO',
    'ADMINISTRATIVO',
    'TREINADOR',
    'GERENTE',
  ], { required_error: 'Cargo é obrigatório' }),
  salario: z.number().positive('Salário deve ser positivo').optional(),
  telefone: z.string().min(10, 'Telefone inválido').optional(),
  email: z.string().email('E-mail inválido').optional(),
  observacoes: z.string().optional(),
  // fotoUrl será tratado separadamente com upload (multipart/form-data)
});

export type CreateFuncionarioDto = z.infer<typeof createFuncionarioSchema>;