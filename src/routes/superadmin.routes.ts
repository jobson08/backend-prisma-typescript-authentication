// src/routes/superadmin.routes.ts
import { Router } from 'express';
import { atualizarPlano, buscarEscolinha, criarEscolinha, listarEscolinhas, suspenderPagamento } from '../controllers/superadmin.controller';
import { authMiddleware, roleGuard } from '../middleware/auth.middleware';

const router = Router();

// POST /api/v1/superadmin/escolinhas
// Protegida: só SUPERADMIN pode criar
router.post('/escolinhas', authMiddleware, roleGuard('SUPERADMIN'), criarEscolinha);

// GET /api/v1/superadmin/escolinhas
router.get('/escolinhas', authMiddleware, roleGuard('SUPERADMIN'), listarEscolinhas);

// GET /api/v1/superadmin/escolinhas/:id
router.get('/escolinhas/:id', authMiddleware, roleGuard('SUPERADMIN'), buscarEscolinha);

// Atualizar Plano
router.put('/escolinhas/:id/plano', authMiddleware, roleGuard('SUPERADMIN'), atualizarPlano);

// Suspender Pagamento
router.put('/escolinhas/:id/suspender', authMiddleware, roleGuard('SUPERADMIN'), suspenderPagamento);

export default router;