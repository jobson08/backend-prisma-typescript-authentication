// src/dto/create-aluno.dto.ts
import { z } from 'zod';

export const createAlunoSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  
  // AQUI ESTAVA O PROBLEMA — ACEITA QUALQUER FORMATO DE DATA VÁLIDA
  birthDate: z.string().refine((val) => {
    return !isNaN(Date.parse(val));
  }, { message: 'Data de nascimento inválida' }),

  phone: z.string().optional().nullable(),
 // responsavelId: z.string().uuid('ID do responsável inválido').optional().nullable(), //responsavel opcional
  responsavelId: z.string().uuid('ID do responsável inválido'), //responsavel obrigatorio
  observations: z.string().optional().nullable(),
  status: z.enum(['ATIVO', 'INATIVO', 'TRANCADO']).default('ATIVO'),
});
export const updateAlunoSchema = createAlunoSchema.partial();

export type CreateAlunoDto = z.infer<typeof createAlunoSchema>;