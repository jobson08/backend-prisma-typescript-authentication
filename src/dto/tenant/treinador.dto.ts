// src/dto/tenant/treinador.dto.ts
import { z } from 'zod';

export const CreateTreinadorSchema = z.object({
  nome: z.string().min(3, 'Nome completo é obrigatório'),
  email: z.string().email('E-mail inválido').min(1, 'E-mail é obrigatório'),
  telefone: z.string().min(10, 'Telefone inválido').optional(),
  dataNascimento: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD')
    .optional(),
  observacoes: z.string().optional(),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),
});

export const UpdateTreinadorSchema = z.object({
  nome: z.string().min(3, 'Nome completo é obrigatório').optional(),
  email: z.string().email('E-mail inválido').optional(),
  telefone: z.string().min(10, 'Telefone inválido').optional(),
  dataNascimento: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD')
    .optional(),
  observacoes: z.string().optional(),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),
});

export interface TreinadorResponseDto {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  fotoUrl?: string;
  dataNascimento?: Date;
  observacoes?: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
  escolinha: {
    id: string;
    nome: string;
  };
  user?: {
    id: string;
    email: string;
  };
}

export type CreateTreinadorDto = z.infer<typeof CreateTreinadorSchema>;
export type UpdateTreinadorDto = z.infer<typeof UpdateTreinadorSchema>;