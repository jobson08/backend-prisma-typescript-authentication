// src/routes/auth.routes.ts
import { Router } from 'express';
import { login } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware'; // ← importe seu middleware

const router = Router();

// POST /api/v1/auth/login (já existe)
router.post('/login', login);

// GET /api/v1/auth/me - retorna o usuário atual (protegida pelo authMiddleware)
router.get('/me', authMiddleware, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  // Retorna o user que o middleware já montou (com tenantId, role, etc)
  return res.status(200).json(req.user);
});

export default router;