import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { JWTPayload } from './auth.types';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = AuthService.verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

// Middlewares específicos
export const isSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  authenticate(req, res, () => {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Acesso negado. Apenas Super Admin.' });
    }
    next();
  });
};

export const isTenantAdmin = (req: Request, res: Response, next: NextFunction) => {
  authenticate(req, res, () => {
    if (!req.user?.tenantId || !['ADMIN', 'TREINADOR'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }
    next();
  });
};

export const isResponsavel = (req: Request, res: Response, next: NextFunction) => {
  authenticate(req, res, () => {
    if (req.user?.role !== 'RESPONSAVEL') {
      return res.status(403).json({ error: 'Acesso negado.' });
    }
    next();
  });
};