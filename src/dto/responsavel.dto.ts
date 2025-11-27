// src/dto/create-responsavel.dto.ts
import { z } from 'zod';

export const createResponsavelSchema = z.object({
name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional().nullable(),
  cpf: z.string().optional().nullable(),
  relacionamento: z.string().optional().nullable(), // ← AQUI!
  observations: z.string().optional().nullable(),
});

export type CreateResponsavelDto = z.infer<typeof createResponsavelSchema>;