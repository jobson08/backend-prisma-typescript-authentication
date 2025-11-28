// src/routes/aluno.routes.ts
import { Router } from 'express';
import { alunoController } from '../controllers/aluno.controller';

const router = Router();

router.post('/', alunoController.create); // /api/alunos ← CRIAR ALUNO
router.get('/', alunoController.getAll);      // /api/alunos ← LISTAR TODOS 
router.get('/:id', alunoController.getById);  // /api/aluno/alunoID ← VER POR ID
router.patch('/:id', alunoController.update);  // /api/aluno/alunoID ← EDITAR
router.delete('/:id', alunoController.delete); // ← EXCLUIR (opcional)

//criar usuario aluno
router.post('/:id/criar-usuario', alunoController.criarUsuario); // /api/aluno/alunoID/criar-usuario
//editar usuario aluno
router.patch('/:id/usuario', alunoController.editarUsuario); // /api/aluno/alunoID/criar-usuario
//buscar usuario aluno ID
router.get('/:id/tem-usuario', alunoController.temUsuario); // /api/aluno/alunoID/tem-usuario

export default router;