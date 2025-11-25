// src/types/express.d.ts
import { Usuario } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        role: string;
        email: string;
        tenantId: string | null;
      };
      tenantId?: string
    }
  }
}