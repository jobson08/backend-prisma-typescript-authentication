// src/routes/superadmin.routes.ts
import { Router } from 'express';
import { criarEscolinha } from '../controllers/superadmin.controller';
import { authMiddleware, roleGuard } from '../middleware/auth.middleware';

const router = Router();

// POST /api/v1/superadmin/escolinhas
// Protegida: só SUPERADMIN pode criar
router.post('/escolinhas', authMiddleware, roleGuard('SUPERADMIN'), criarEscolinha);

export default router;