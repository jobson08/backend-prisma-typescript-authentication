// src/middleware/tenant.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export const tenantMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = req.user;

    // Super Admin pode tudo (não tem tenantId)
    if (user.role === 'SUPER_ADMIN') {
      return next();
    }

    // Todos os outros (ADMIN, TREINADOR, etc.) PRECISAM ter tenantId
    if (!user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado: usuário sem tenant',
      });
    }

    // Opcional: verifica se o tenant realmente existe (segurança extra)
    const tenantExists = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { id: true },
    });

    if (!tenantExists) {
      return res.status(403).json({
        success: false,
        error: 'Tenant não encontrado ou foi removido',
      });
    }

    // Adiciona o tenantId no req pra usar nas rotas (super útil!)
    req.tenantId = user.tenantId;

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Erro no middleware de tenant' });
  }
};