// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não está definido no .env');
}

// Tipos de usuário e roles
export type UserRole = 
  | 'SUPERADMIN'
  | 'ADMIN'
  | 'TREINADOR'
  | 'RESPONSAVEL'
  | 'ALUNO_FUTEBOL'
  | 'ALUNO_CROSSFIT'
  | 'FUNCIONARIO';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  tenantId: string | null; // null para SUPERADMIN
  escolinha?: {
    id: string;
    nome: string;
    logoUrl: string | null;
  } | null;
}

// Extensão do Request para TypeScript
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Middleware de autenticação principal
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido ou inválido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Decodifica o JWT
    const payload = jwt.verify(token, JWT_SECRET) as { id: string; exp: number; iat: number };

    // Busca o usuário no banco com dados da escolinha (se existir)
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        escolinha: {
          select: {
            id: true,
            nome: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    // Monta o objeto user no request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      tenantId: user.tenantId,
      escolinha: user.escolinha
        ? {
            id: user.escolinha.id,
            nome: user.escolinha.nome,
            logoUrl: user.escolinha.logoUrl,
          }
        : null,
    };

    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

// Middleware para proteger por role específico
export const roleGuard = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado: permissão insuficiente' });
    }

    next();
  };
};

// Middleware para garantir que o usuário tenha escolinha (exceto SuperAdmin)
export const tenantGuard = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  if (req.user.role !== 'SUPERADMIN' && !req.user.tenantId) {
    return res.status(403).json({ error: 'Usuário não associado a nenhuma escolinha' });
  }

  next();
};