// src/middleware/tenant.middleware.ts
import { Request, Response, NextFunction } from 'express';

export const tenantGuard = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const role = req.user.role?.toUpperCase();

  // ===================== PERMISSÕES =====================

  // SUPERADMIN pode acessar tudo
  if (role === 'SUPERADMIN') {
    return next();
  }

  // TREINADOR + ADMIN + FUNCIONARIO podem acessar rotas tenant
  if (['ADMIN', 'TREINADOR', 'FUNCIONARIO'].includes(role)) {
    req.escolinhaId = req.user.escolinhaId || req.user.tenantId || undefined;

    if (!req.escolinhaId) {
      return res.status(403).json({ error: 'Usuário não associado a nenhuma escolinha' });
    }

    return next();
  }

  // Alunos e Responsáveis também podem acessar (se necessário)
  if (['ALUNO_FUTEBOL', 'ALUNO_CROSSFIT', 'RESPONSAVEL'].includes(role)) {
    req.escolinhaId = req.user.escolinhaId || req.user.tenantId || undefined;
    return next();
  }

  // Bloqueia qualquer outro role
  return res.status(403).json({ error: 'Acesso negado: permissão insuficiente' });
};