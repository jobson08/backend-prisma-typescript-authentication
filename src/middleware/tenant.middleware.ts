// src/middleware/tenant.middleware.ts
import { Request, Response, NextFunction } from 'express';

export const tenantGuard = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  // SUPERADMIN pode acessar sem escolinhaId (global)
  if (req.user.role === 'SUPERADMIN') {
    return next();
  }

  // Para ADMIN e outros roles, exige escolinhaId
  if (!req.user.escolinhaId) {
    return res.status(403).json({ error: 'Usuário não associado a nenhuma escolinha' });
  }

  // Injeta no request para uso nos controllers
  req.escolinhaId = req.user.escolinhaId;
  next();
};