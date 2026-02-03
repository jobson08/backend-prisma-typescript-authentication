// src/routes/tenant.routes.ts
import { Router } from 'express';
import { authMiddleware, roleGuard } from '../middleware/auth.middleware';
import { tenantGuard } from '../middleware/tenant.middleware'; // middleware que valida e injeta escolinhaId

import { createFuncionario, deleteFuncionario, getFuncionarioById, listFuncionarios, updateFuncionario } from '../controllers/tenant/funcionario.controller';
import { createOrUpdateLogin } from '../controllers/createOrUpdateLogin';
import { createResponsavel, deleteResponsavel, getResponsavelById, listResponsaveis, updateResponsavel } from '../controllers/tenant/responsavel.controller';
import { createAluno, deleteAluno, getAlunoById, listAlunos, updateAluno } from '../controllers/tenant/aluno-futebol.controller';
import { createAlunoCrossfit, deleteAlunoCrossfit, getAlunoCrossfitById, listAlunosCrossfit, updateAlunoCrossfit } from '../controllers/tenant/aluno-crossfit.controller';
import { pagamentosCrossfitController } from '../controllers/tenant/pagamentos-crossfit.controller';
import { getDashboardTenant } from '../controllers/tenant/dashboard-tenant.controller';

// Rotas específicas do tenant (painel da escolinha)
const router = Router();

// Proteção: só ADMIN da escolinha pode acessar essas rotas
router.use(authMiddleware, roleGuard('ADMIN'), tenantGuard);

router.get('/dashboard', authMiddleware, roleGuard('ADMIN'), tenantGuard, getDashboardTenant);

//Rotas Funcionario
router.post('/funcionarios', authMiddleware, roleGuard('ADMIN'), tenantGuard, createFuncionario);
router.get('/funcionarios', authMiddleware, roleGuard('ADMIN'), tenantGuard, listFuncionarios);
router.get('/funcionarios/:id', authMiddleware, roleGuard('ADMIN'), tenantGuard, getFuncionarioById);
router.post('/funcionarios', authMiddleware, roleGuard('ADMIN'), tenantGuard, createFuncionario);
router.put('/funcionarios/:id', authMiddleware, roleGuard('ADMIN'), tenantGuard, updateFuncionario);
router.delete('/funcionarios/:id', authMiddleware, roleGuard('ADMIN'), tenantGuard, deleteFuncionario);

// Responsáveis (protegidos por ADMIN do tenant)
router.get('/responsaveis', authMiddleware, roleGuard('ADMIN'), listResponsaveis);
router.get('/responsaveis/:id', authMiddleware, roleGuard('ADMIN'), getResponsavelById);
router.post('/responsaveis', authMiddleware, roleGuard('ADMIN'), createResponsavel);
router.put('/responsaveis/:id', authMiddleware, roleGuard('ADMIN'), updateResponsavel);
router.patch('/responsaveis/:id', authMiddleware, roleGuard('ADMIN'), updateResponsavel);
router.delete('/responsaveis/:id', authMiddleware, roleGuard('ADMIN'), deleteResponsavel);

// Alunos (protegidos por ADMIN do tenant)
router.post('/alunos', authMiddleware, roleGuard('ADMIN'), createAluno);
router.put('/alunos/:id', authMiddleware, roleGuard('ADMIN'), updateAluno);
router.patch('/alunos/:id', authMiddleware, roleGuard('ADMIN'), updateAluno);
router.get('/alunos', authMiddleware, roleGuard('ADMIN'), listAlunos);
router.get('/alunos/:id', authMiddleware, roleGuard('ADMIN'), getAlunoById);
router.delete('/alunos/:id', authMiddleware, roleGuard('ADMIN'), deleteAluno);

// aluno crossfit (protegidos por ADMIN do tenant)
router.post('/alunos-crossfit',authMiddleware, roleGuard('ADMIN'), createAlunoCrossfit);
router.get( '/alunos-crossfit',authMiddleware, roleGuard('ADMIN'), listAlunosCrossfit);
router.get('/alunos-crossfit/:id',authMiddleware, roleGuard('ADMIN'), getAlunoCrossfitById);
router.patch('/alunos-crossfit/:id',authMiddleware, roleGuard('ADMIN'), updateAlunoCrossfit);
router.put('/alunos-crossfit/:id',authMiddleware, roleGuard('ADMIN'), updateAlunoCrossfit);
router.delete('/alunos-crossfit/:id',authMiddleware, roleGuard('ADMIN'), deleteAlunoCrossfit);


//rota criar pagamentos

//pagamentos alunoCrossfit

// Geração MANUAL (admin cria para um aluno específico)
router.post(
  '/alunos-crossfit/:alunoId/mensalidades/manual',authMiddleware,
  roleGuard('ADMIN'),
  pagamentosCrossfitController.createManual.bind(pagamentosCrossfitController)
);

// Geração AUTOMÁTICA (chamada por cron job ou manualmente pelo admin)
router.post(
  '/mensalidades-crossfit/gerar-automaticas',authMiddleware,
  roleGuard('ADMIN'), // ou crie um middleware específico para cron
  pagamentosCrossfitController.generateAutomatic.bind(pagamentosCrossfitController)
);

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