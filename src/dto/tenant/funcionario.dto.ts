// src/dto/tenant/funcionario.dto.ts
import { z } from 'zod';

// Schema para criação de Funcionário (login obrigatório)
export const createFuncionarioSchema = z.object({
  nome: z.string().min(3, 'Nome completo obrigatório'),
  cpf: z.string().regex(/^\d{11}$/, "CPF deve ter exatamente 11 dígitos").optional(),
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

export const updateFuncionarioSchema =  z.object({
 nome: z.string().min(3).optional(),
  cpf: z.string().optional(),
  telefone: z.string().optional(),
  cargo: z.enum(["PROFESSOR", "RECEPCAO", "ADMINISTRATIVO", "TREINADOR", "GERENTE"]).optional(),
  salario: z.number().positive().nullable().optional(),
  observacoes: z.string().nullable().optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),           // permite undefined
  fotoUrl: z.string().nullable().optional(),        // aceita string, null ou undefined
});


export type CreateFuncionarioDto = z.infer<typeof createFuncionarioSchema>;
export type UpdateFuncionarioDto = z.infer<typeof updateFuncionarioSchema>;