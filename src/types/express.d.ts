// src/types/express.d.ts
import { Role } from '@prisma/client'; // se você tiver o enum Role no Prisma

// Tipo completo do usuário autenticado no req.user
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: Role; // usa o enum do Prisma: SUPERADMIN, ADMIN, TREINADOR, etc
  tenantId: string | null; // null para SUPERADMIN
  escolinha?: {
    id: string;
    nome: string;
    logoUrl: string | null;
  } | null;
}

// Declaração global única para o Express
declare global {
  namespace Express {
    interface Request {
      /** Usuário autenticado (definido pelo authMiddleware) */
      user?: AuthUser;

      /** ID da escolinha (conveniência, preenchido em middlewares se necessário) */
      tenantId?: string;
    }
  }
}