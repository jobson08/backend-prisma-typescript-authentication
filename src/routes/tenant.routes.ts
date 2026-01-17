// src/routes/tenant.routes.ts
import { Router } from 'express';
import { authMiddleware, roleGuard } from '../middleware/auth.middleware';
import { tenantGuard } from '../middleware/tenant.middleware'; // middleware que valida e injeta escolinhaId
import { getDashboardTenant } from '../controllers/dashboard-tenant.controller';
import { createFuncionario } from '../controllers/funcionario.controller';

// Rotas específicas do tenant (painel da escolinha)
const router = Router();

// Proteção: só ADMIN da escolinha pode acessar essas rotas
router.use(authMiddleware, roleGuard('ADMIN'), tenantGuard);

router.get('/dashboard', getDashboardTenant);
//Rotas Funcionario
router.post('/funcionarios', authMiddleware, roleGuard('ADMIN'), tenantGuard, createFuncionario);

// Aqui você pode adicionar mais rotas do tenant no futuro:
// router.get('/alunos', getAlunosTenant);
// router.post('/funcionarios', createFuncionarioTenant);
// etc.

export default router;