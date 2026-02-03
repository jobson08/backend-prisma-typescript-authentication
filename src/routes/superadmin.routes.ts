// src/routes/superadmin.routes.ts
import { Router } from 'express';

import { authMiddleware, roleGuard } from '../middleware/auth.middleware';
import { atualizarEscolinha, atualizarPlano, buscarEscolinha, criarEscolinha, dashboard, listarEscolinhas, listarPagamentos, suspenderPagamento } from '../controllers/superadmin/superadmin.controller';
import { saasPagamentoController } from '../controllers/superadmin/saas-pagamento.controller';


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

//pagamento ssas escolinhas
// Rota para criação manual
router.post(
  '/escolinhas/:escolinhaId/pagamentos-saas/manual', authMiddleware,
  roleGuard('SUPERADMIN'),
  saasPagamentoController.createManual.bind(saasPagamentoController)
);

// Trigger manual da geração automática (somente SUPERADMIN, para testes)
router.post(
  '/pagamentos-saas/gerar-automaticas', authMiddleware,
  roleGuard('SUPERADMIN'),
  saasPagamentoController.triggerAutomatic.bind(saasPagamentoController)
);

//resgistrar pagamento na pagina pagamento manual
router.put(
  '/pagamentos/:pagamentoId/marcar-pago',authMiddleware,
  roleGuard('SUPERADMIN'),
  saasPagamentoController.marcarPago.bind(saasPagamentoController)
);
export default router;