// src/routes/tenant.routes.ts
import { Router } from 'express';
import { authMiddleware, roleGuard } from '../middleware/auth.middleware';
import { tenantGuard } from '../middleware/tenant.middleware'; // middleware que valida e injeta escolinhaId
import { getDashboardTenant } from '../controllers/tenant/dashboard-tenant.controller';
import { createFuncionario, deleteFuncionario, getFuncionarioById, listFuncionarios, updateFuncionario } from '../controllers/tenant/funcionario.controller';
import { createOrUpdateLogin } from '../controllers/createOrUpdateLogin';

// Rotas específicas do tenant (painel da escolinha)
const router = Router();

// Proteção: só ADMIN da escolinha pode acessar essas rotas
router.use(authMiddleware, roleGuard('ADMIN'), tenantGuard);

router.get('/dashboard', getDashboardTenant);
//Rotas Funcionario
router.post('/funcionarios', authMiddleware, roleGuard('ADMIN'), tenantGuard, createFuncionario);
router.get('/funcionarios', authMiddleware, roleGuard('ADMIN'), tenantGuard, listFuncionarios);
router.get('/funcionarios/:id', authMiddleware, roleGuard('ADMIN'), tenantGuard, getFuncionarioById);
router.post('/funcionarios', authMiddleware, roleGuard('ADMIN'), tenantGuard, createFuncionario);
router.put('/funcionarios/:id', authMiddleware, roleGuard('ADMIN'), tenantGuard, updateFuncionario);
router.delete('/funcionarios/:id', authMiddleware, roleGuard('ADMIN'), tenantGuard, deleteFuncionario);

// Aqui você pode adicionar mais rotas do tenant no futuro:
// router.get('/alunos', getAlunosTenant);
// router.post('/funcionarios', createFuncionarioTenant);
// etc.

// Criar ou editar login para QUALQUER entidade
router.post(
  '/login/:entityType/:entityId',
  authMiddleware,
  roleGuard('ADMIN', 'SUPERADMIN'), // ← passe os roles como argumentos separados
  tenantGuard,
  createOrUpdateLogin
);
export default router;