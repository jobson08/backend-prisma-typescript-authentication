// src/routes/tenant.routes.ts
import { Router } from 'express';
import multer from "multer";
import { Request, Response } from 'express';
import uploadImagensRoutes from './uploadImagens.routes';

import { authMiddleware, roleGuard } from '../middleware/auth.middleware';
import { tenantGuard } from '../middleware/tenant.middleware'; // middleware que valida e injeta escolinhaId
import { createFuncionario, deleteFuncionario, getFuncionarioById, listFuncionarios, updateFuncionario, listTreinadoresController, redefinirSenhaFuncionario } from '../controllers/tenant/funcionario.controller';
import { createOrUpdateLogin } from '../controllers/createOrUpdateLogin';
import { createResponsavel, deleteResponsavel, getResponsavelById, listResponsaveis, updateResponsavel, redefinirSenhaResponsavel } from '../controllers/tenant/responsavel.controller';
import { createAluno, deleteAluno, getAlunoById, listAlunos, updateAluno, redefinirSenhaAluno, listAlunosByCategoria } from '../controllers/tenant/aluno-futebol.controller';
import { createAlunoCrossfit, deleteAlunoCrossfit, getAlunoCrossfitById, listAlunosCrossfit, updateAlunoCrossfit, redefinirSenhaAlunoCrossfit, criarTurma, atualizarTurma, listarTurmas, inscreverAluno, atualizarInscricao, excluirInscricao, listarInscricoes, excluirTurma, toggleCrossfitActivation } from '../controllers/tenant/aluno-crossfit.controller';
import { getAlunosInadimplentes, getAniversariantesSemana, getDashboardTenant } from '../controllers/tenant/dashboard-tenant.controller';
import { pagamentosController } from '../controllers/tenant/pagamentos.controlle';
import { createTreinoFutebolController, getTreinoByIdController, listTreinosFutebolController, editeTreinoFutebolController, getProximasAulasSemanaController, deleteTreino} from '../controllers/tenant/treinos-futebol.controller';
//import { createTreinoRecorrente, listTreinosRecorrentes, generateTreinosMes } from '../controllers/tenant/treinoRecorrenteController';

import { createPagamentoManualFutebol, generatePagamentoAutomaticFutebol, listByAlunoFutebol, deletePagamentoFutebol} from '../controllers/tenant/pagamentos-futebol.controller';
//import { pagamentosFutebolController} from '../controllers/tenant/pagamentos-futebol.controller';

import * as alunoFutebolController from '../controllers/tenant/alunoFutebolUser.controller';
import { FinanceiroMensalQuerySchema } from '../dto/tenant/financeiro.dto';
import { InadimplentesQuerySchema } from '../dto/tenant/inadimplentes.dto';
import { createManualCrossfit, deletePagamentoCrossfit, generateAutomaticCrossfit, listByAlunoCrossfit } from '../controllers/tenant/pagamentos-crossfit.controller';
import { escolinhaConfigController } from '../controllers/tenant/escolinha-config.controller';
//import { upload } from '../config/multer';
import { createAulaExtra, deleteAulaExtra, getAll, getById, toggleAulasExtrasActivation, updateAulaExtra } from '../controllers/tenant/aula-extra.controller';
import { aulaExtraAlunoController } from '../controllers/tenant/aula-extra-alunos-professor.controller';
import { getFinanceiroMensalController } from '../controllers/tenant/financeiro.controller';
import { validate } from '../middleware/validate';
import { getInadimplentesController } from '../controllers/tenant/inadimplentes.controller';
import { createTreinoRecorrente, generateTreinosMes, getTreinoRecorrenteById, listTreinosRecorrentes, updateTreinoRecorrente, deleteTreinoRecorrente } from '../controllers/tenant/treinoRecorrente.controller';

//----------------- Rotas específicas do tenant (painel da escolinha)----------------------
const router = Router();

// Configuração Multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Apenas imagens são permitidas"));
    }
  },
});

// ==================== ROTAS PARA DASHBOARD USER DO ALUNO FUTEBOL ====================

// Perfil do aluno logado
router.get('/aluno-futebol/me', 
  authMiddleware, 
 // tenantGuard, 
  alunoFutebolController.getMeuPerfil
);

// Próximos treinos do aluno logado
router.get('/aluno-futebol/proximos-treinos', 
  authMiddleware, 
 // tenantGuard, 
  alunoFutebolController.getProximosTreinos
);

// Estatísticas do aluno
router.get('/aluno-futebol/estatisticas', 
  authMiddleware, 
  //tenantGuard, 
  alunoFutebolController.getEstatisticas
);

// Trocar senha do aluno
router.post('/aluno-futebol/trocar-senha', 
  authMiddleware, 
  //tenantGuard, 
  alunoFutebolController.trocarSenhaAluno
);

router.get('/aluno-futebol/presencas', 
  authMiddleware, 
  alunoFutebolController.getPresencas
);

router.get('/aluno-futebol/avaliacoes', 
  authMiddleware, 
  alunoFutebolController.getAvaliacoes
);


//----------------------------- Proteção: só ADMIN da escolinha pode acessar essas rotas-----------------
router.use(authMiddleware, roleGuard('ADMIN'), tenantGuard);

//----------------------------Rotas Funcionario (protegidos por ADMIN do tenant)---------------------
router.post('/funcionarios', authMiddleware, roleGuard('ADMIN'), upload.single("foto"), tenantGuard, createFuncionario);
router.get('/funcionarios', authMiddleware, roleGuard('ADMIN'), tenantGuard, listFuncionarios);
router.get('/funcionarios/:id', authMiddleware, roleGuard('ADMIN'), tenantGuard, getFuncionarioById);
router.put('/funcionarios/:id', authMiddleware, roleGuard('ADMIN'), tenantGuard, updateFuncionario);
router.delete('/funcionarios/:id', authMiddleware, roleGuard('ADMIN'), tenantGuard, deleteFuncionario);
router.post('/funcionarios/:id/redefinir-senha', authMiddleware, roleGuard('ADMIN'), tenantGuard, redefinirSenhaFuncionario);
router.get('/funcionarios-treinadores', authMiddleware, roleGuard('ADMIN'), tenantGuard, listTreinadoresController);

// -----------------------Responsáveis (protegidos por ADMIN do tenant)-----------------------------
router.post('/responsaveis', authMiddleware, roleGuard('ADMIN'), upload.single("foto"), createResponsavel);
router.get('/responsaveis', authMiddleware, roleGuard('ADMIN'),  listResponsaveis);
router.get('/responsaveis/:id', authMiddleware, roleGuard('ADMIN'), getResponsavelById);
router.put('/responsaveis/:id', authMiddleware, roleGuard('ADMIN'), updateResponsavel);
router.patch('/responsaveis/:id', authMiddleware, roleGuard('ADMIN'), updateResponsavel);
router.delete('/responsaveis/:id', authMiddleware, roleGuard('ADMIN'), deleteResponsavel);
router.post('/responsaveis/:id/redefinir-senha',authMiddleware,roleGuard('ADMIN'),tenantGuard,redefinirSenhaResponsavel);
// ------------------------------Alunos Futebol (protegidos por ADMIN do tenant)-----------------------
router.post("/alunos", authMiddleware, roleGuard('ADMIN'), upload.single("foto"), createAluno);
router.put('/alunos/:id', authMiddleware, roleGuard('ADMIN'), updateAluno);
router.patch('/alunos/:id', authMiddleware, roleGuard('ADMIN'), updateAluno);
router.get('/alunos', authMiddleware, roleGuard('ADMIN'), listAlunos);
router.get('/alunos', authMiddleware, roleGuard('ADMIN'), listAlunosByCategoria);
router.get('/alunos/:id', authMiddleware, roleGuard('ADMIN'), getAlunoById);
router.delete('/alunos/:id', authMiddleware, roleGuard('ADMIN'), deleteAluno);
router.post('/alunos/:id/redefinir-senha',authMiddleware, roleGuard('ADMIN'),tenantGuard, redefinirSenhaAluno);

// ---------------------------aluno crossfit (protegidos por ADMIN do tenant)---------------------------
router.post('/alunos-crossfit',authMiddleware, roleGuard('ADMIN'), upload.single("foto"), createAlunoCrossfit);
router.get( '/alunos-crossfit',authMiddleware, roleGuard('ADMIN'), listAlunosCrossfit);
router.get('/alunos-crossfit/:id',authMiddleware, roleGuard('ADMIN'), getAlunoCrossfitById);
router.patch('/alunos-crossfit/:id',authMiddleware, roleGuard('ADMIN'), updateAlunoCrossfit);
router.put('/alunos-crossfit/:id',authMiddleware, roleGuard('ADMIN'), updateAlunoCrossfit);
router.delete('/alunos-crossfit/:id',authMiddleware, roleGuard('ADMIN'), deleteAlunoCrossfit);
router.post('/alunos-crossfit/:id/redefinir-senha',authMiddleware, roleGuard('ADMIN'),tenantGuard, redefinirSenhaAlunoCrossfit);

//---------------------------------------treinios Dashboar ------------------------------------------
router.post('/treinos-futebol', authMiddleware, roleGuard('ADMIN'), tenantGuard, createTreinoFutebolController);
router.get('/treinos-futebol', authMiddleware, roleGuard('ADMIN'), tenantGuard, listTreinosFutebolController);
router.get('/treinos-futebol/:id', authMiddleware, roleGuard('ADMIN'), tenantGuard, getTreinoByIdController);
router.put('/treinos-futebol/:id', authMiddleware, roleGuard('ADMIN'), tenantGuard, editeTreinoFutebolController);
router.get('/proximas-aulas-semana',authMiddleware, roleGuard('ADMIN'),tenantGuard, getProximasAulasSemanaController);
router.delete('/treinos-futebol/:id',authMiddleware, roleGuard('ADMIN'),tenantGuard, deleteTreino);

// Rotas de Treino Recorrente
router.post('/treinos-recorrentes', 
  authMiddleware, 
  roleGuard('ADMIN'), 
  tenantGuard, 
 createTreinoRecorrente
);

router.get('/treinos-recorrentes', 
  authMiddleware, 
  tenantGuard, 
listTreinosRecorrentes
);

// Detalhes de Treino Recorrente
router.get('/treinos-recorrentes/:id', 
  authMiddleware, 
  tenantGuard, 
 getTreinoRecorrenteById
);

router.get('/treinos-gerados-mes', 
  authMiddleware, 
  tenantGuard, 
  generateTreinosMes
);

router.put('/treinos-recorrentes/:id', 
  authMiddleware, 
  tenantGuard, 
  updateTreinoRecorrente
);

// Excluir Treino Recorrente
router.delete('/treinos-recorrentes/:id', 
  authMiddleware, 
  roleGuard('ADMIN'), 
  tenantGuard, 
  deleteTreinoRecorrente
);




// Rota dashboard 
router.get('/dashboard', authMiddleware, roleGuard('ADMIN'), tenantGuard, getDashboardTenant);
//rotas todos alunos inadiplentes
router.get('/alunos-inadimplentes', authMiddleware, roleGuard('ADMIN'), getAlunosInadimplentes);
//rotas todos alunos aniversariantes-semana
router.get('/aniversariantes-semana', authMiddleware, roleGuard('ADMIN'), getAniversariantesSemana);



//-------------------------------ROTAS DE PAGAMENTO ALUNO FUTEBOL---------------------------
//pagamentos Aluno futebol
// POST /tenant/alunos/:alunoId/pagamentos
router.post('/alunos/:alunoId/pagamentos', authMiddleware,  roleGuard('ADMIN'),createPagamentoManualFutebol);

// Cron (pode ser protegida ou pública, dependendo da segurança)
router.post('/pagamentos/generate-automatic', authMiddleware, roleGuard('ADMIN'), generatePagamentoAutomaticFutebol);

  // Get pagamentos aluno
 router.get('/alunos/:alunoId/pagamentos', authMiddleware, roleGuard('ADMIN'),listByAlunoFutebol);

 //Dele Pagamento alunos futebol
 router.delete('/alunos/:alunoId/pagamentos/:pagamentoId', authMiddleware, roleGuard('ADMIN'),deletePagamentoFutebol);


//--------------------------------ROTAS DE PAGAMENTO ALUNO CROSSFIT--------------------- 
// Geração MANUAL (admin cria para um aluno específico)
router.post('/alunos-crossfit/:alunoId/mensalidades/manual',authMiddleware, roleGuard('ADMIN'), createManualCrossfit);
// Geração AUTOMÁTICA (chamada por cron job ou manualmente pelo admin)
router.post('/mensalidades-crossfit/gerar-automaticas',authMiddleware, roleGuard('ADMIN'), generateAutomaticCrossfit);
// Get pagamentos aluno
router.get('/mensalidades-crossfit/gerar-automaticas', authMiddleware, roleGuard('ADMIN'),listByAlunoCrossfit );
//Excluir pagamento 
router.delete('/alunos-crossfit/:alunoId/mensalidades/:pagamentoId', authMiddleware, roleGuard('ADMIN'), tenantGuard, deletePagamentoCrossfit);
//pagamento aluno futebol e aluno crossfit 
router.put('/pagamentos/:pagamentoId/marcar-pago',authMiddleware, roleGuard('ADMIN'), pagamentosController.marcarComoPago);

//----------------------------rotas de gestão  de aulas crossfit com alunos---------------------------------
//criar
router.post('/crossfit/turmas',authMiddleware, roleGuard('ADMIN'), criarTurma);
//Editar
router.put('/crossfit/turmas/:id', authMiddleware, roleGuard('ADMIN'), tenantGuard, atualizarTurma);
//get turmas
router.get('/crossfit/turmas', authMiddleware, roleGuard('ADMIN'), tenantGuard, listarTurmas);
//Excluir turmas
router.delete('/crossfit/turmas/:id', authMiddleware, roleGuard('ADMIN'), tenantGuard, excluirTurma);
//ativa e desativa aula extra na pagina configuração
router.put('/config/crossfit/activation', authMiddleware, roleGuard('ADMIN'), tenantGuard, toggleCrossfitActivation);

// Inscrições
router.post('/crossfit/inscricoes', authMiddleware, roleGuard('ADMIN'), tenantGuard, inscreverAluno);
router.put('/crossfit/inscricoes/:id', authMiddleware, roleGuard('ADMIN'), tenantGuard, atualizarInscricao);
router.delete('/crossfit/inscricoes/:id', authMiddleware, roleGuard('ADMIN'), tenantGuard, excluirInscricao);
router.get('/crossfit/inscricoes/:turmaId', authMiddleware, roleGuard('ADMIN'), tenantGuard, listarInscricoes);

// -----------------------Configurações da Escolinha---------------------
router.get('/config/escolinha', authMiddleware, roleGuard('ADMIN'), tenantGuard, escolinhaConfigController.getConfig);

router.put( '/config/geral', authMiddleware, roleGuard('ADMIN'), tenantGuard, escolinhaConfigController.updateGeral);

router.put('/config/aulas-extras', authMiddleware, roleGuard('ADMIN'), tenantGuard, escolinhaConfigController.updateAulasExtras);

router.put('/config/crossfit', authMiddleware, roleGuard('ADMIN'), tenantGuard, escolinhaConfigController.updateCrossfit);

// Uploads de imagens
router.post('/config/logo', authMiddleware, roleGuard('ADMIN'), tenantGuard, upload.single('logo'), // multer
escolinhaConfigController.uploadLogo);

router.post('/config/crossfit-banner', authMiddleware, roleGuard('ADMIN'), tenantGuard, upload.single('banner'), // multer
  escolinhaConfigController.uploadCrossfitBanner);

 
//=========================Rotas de criar edita  e ecluir aulas extras============================================  
// Criação de aula extra individual
router.post('/config/aulas-extras', authMiddleware, roleGuard('ADMIN'), tenantGuard, createAulaExtra);
// Atualização da configuração completa (ativação + lista de aulas)
//router.put('/config/aulas-extras', authMiddleware, roleGuard('ADMIN'), tenantGuard, aulaExtraController.updateAulasExtrasConfig);
//Desativar e ativa aula extra na pagina comfiguração
router.put('/config/aulas-extras/activation', authMiddleware, roleGuard('ADMIN'), tenantGuard, toggleAulasExtrasActivation);
// Atualização individual de uma aula (opcional)
router.put('/config/aulas-extras/:id', authMiddleware, roleGuard('ADMIN'), tenantGuard, updateAulaExtra);
//Exclução de aula
router.delete('/config/aulas-extras/:id', authMiddleware, roleGuard('ADMIN'), tenantGuard, deleteAulaExtra);

// Listagem de todas as aulas da escolinha
router.get('/config/aulas-extras', authMiddleware, roleGuard('ADMIN'), tenantGuard, getAll);

// Busca por ID (opcional)
router.get('/config/aulas-extras/:id', authMiddleware, roleGuard('ADMIN'), tenantGuard, getById);

//====================================Rota de de aula-estra-aluno-professor================================
router.post(
  '/aula-extra-aluno',
  authMiddleware,
  roleGuard('ADMIN'),
  tenantGuard,
  aulaExtraAlunoController.create
);

router.put(
  '/aula-extra-aluno/:id',
  authMiddleware,
  roleGuard('ADMIN'),
  tenantGuard,
  aulaExtraAlunoController.update
);

router.delete(
  '/aula-extra-aluno/:id',
  authMiddleware,
  roleGuard('ADMIN'),
  tenantGuard,
  aulaExtraAlunoController.delete
);

router.get(
  '/aula-extra-aluno/aula/:aulaExtraId',
  authMiddleware,
  roleGuard('ADMIN'),
  tenantGuard,
  aulaExtraAlunoController.getAllByAula
);

router.get(
  '/aula-extra-aluno/:id',
  authMiddleware,
  roleGuard('ADMIN'),
  tenantGuard,
  aulaExtraAlunoController.getById
);

//=============== Rota finaceiro (dashboard)======================================================
router.get(
  '/financeiro/mensal',
  authMiddleware,
  roleGuard('ADMIN'),           // ou o role que você quiser permitir
  validate(FinanceiroMensalQuerySchema),
  getFinanceiroMensalController
);

//=============== Rota Inadiplete (dashboard)======================================================
router.get(
  '/inadimplentes',
  authMiddleware,
  roleGuard('ADMIN'),
  validate(InadimplentesQuerySchema),
  getInadimplentesController
);

//=============== Criar ou editar login para QUALQUER entidade======================================================
router.post('/login/:entityType/:entityId', authMiddleware, roleGuard('ADMIN', 'SUPERADMIN'), // ← passe os roles como argumentos separados tenantGuard,
 createOrUpdateLogin);

//Rota de upload de imagens
 router.use(uploadImagensRoutes);

export default router;