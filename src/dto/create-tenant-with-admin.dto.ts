// src/dto/create-tenant-with-admin.dto.ts
import { z } from 'zod';

export const createTenantWithAdminSchema = z.object({
  tenantName: z.string().min(3, 'Nome do tenant muito curto'),

  admin: z.object({
    name: z.string().min(2, 'Nome do admin muito curto'),
    email: z.string().email('E-mail inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  }),
});

export type CreateTenantWithAdminDto = z.infer<typeof createTenantWithAdminSchema>;