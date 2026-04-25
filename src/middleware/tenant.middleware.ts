// src/middleware/tenant.middleware.ts
import { Request, Response, NextFunction } from 'express';

export const tenantGuard = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  // SUPERADMIN pode acessar tudo
  if (req.user.role === 'SUPERADMIN') {
    return next();
  }

  // ALUNOS e RESPONSÁVEIS podem acessar
  if (['ALUNO_FUTEBOL', 'ALUNO_CROSSFIT', 'RESPONSAVEL'].includes(req.user.role)) {
    req.escolinhaId = req.user.escolinhaId || req.user.tenantId || undefined;
    return next();
  }

  // Para ADMIN e outros roles, exige escolinhaId
  if (!req.user.escolinhaId && !req.user.tenantId) {
    return res.status(403).json({ error: 'Usuário não associado a nenhuma escolinha' });
  }

  // Injeta o ID da escolinha
  req.escolinhaId = req.user.escolinhaId || req.user.tenantId || undefined;

  next();
};