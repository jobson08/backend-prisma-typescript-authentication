// src/routes/superadmin.routes.ts
import { Router } from 'express';
import { atualizarEscolinha, atualizarPlano, buscarEscolinha, criarEscolinha, dashboard, listarEscolinhas, listarPagamentos, suspenderPagamento } from '../controllers/superadmin.controller';
import { authMiddleware, roleGuard } from '../middleware/auth.middleware';

const router = Router();

// POST /api/v1/superadmin/escolinhas
// Protegida: só SUPERADMIN pode criar
router.post('/escolinhas', authMiddleware, roleGuard('SUPERADMIN'), criarEscolinha);

// GET /api/v1/superadmin/escolinhas
router.get('/escolinhas', authMiddleware, roleGuard('SUPERADMIN'), listarEscolinhas);

// GET /api/v1/superadmin/escolinhas/:id
//http://localhost:4000/api/v1/superadmin/escolinhas/45f68e03-9240-47c7-887f-a550c2178177
router.get('/escolinhas/:id', authMiddleware, roleGuard('SUPERADMIN'), buscarEscolinha);

//atualizar escolinha
router.put('/escolinhas/:id', authMiddleware, roleGuard('SUPERADMIN'), atualizarEscolinha);

// Atualizar Plano
router.put('/escolinhas/:id/plano', authMiddleware, roleGuard('SUPERADMIN'), atualizarPlano);

//listar pagamento
router.get('/pagamentos', authMiddleware, roleGuard('SUPERADMIN'), listarPagamentos);

// Suspender Pagamento
router.put('/escolinhas/:id/suspender', authMiddleware, roleGuard('SUPERADMIN'), suspenderPagamento);

//CALCULAR RECEITA
router.get('/dashboard', authMiddleware, roleGuard('SUPERADMIN'), dashboard);

export default router;