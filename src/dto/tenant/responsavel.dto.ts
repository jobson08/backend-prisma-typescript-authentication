// src/dto/responsavel.dto.ts
import { z } from 'zod';

// Schema para criação de Responsável
export const createResponsavelSchema = z.object({
  nome: z.string().min(3, 'Nome completo obrigatório'),
  cpf: z.string().optional(),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().min(10, 'Telefone inválido').optional(),
  observacoes: z.string().optional(),
  // Campos para login opcional (se email for fornecido, cria User)
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),
});

export const updateResponsavelSchema = createResponsavelSchema.partial();

export type CreateResponsavelDto = z.infer<typeof createResponsavelSchema>;
export type UpdateResponsavelDto = z.infer<typeof updateResponsavelSchema>;