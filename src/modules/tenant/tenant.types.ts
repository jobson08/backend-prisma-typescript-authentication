import { Tenant } from '@prisma/client';

export type CreateTenantDTO = {
  name: string;
  slug: string;
  domain?: string | null;
  cpfCnpj?: string | null;
  plan: 'basico' | 'premium';
  monthlyFee: number;
};

// Usa o tipo do Prisma diretamente
export type TenantResponse = Tenant & { createdAt: string };