// src/routes/aluno.routes.ts
import { Router } from 'express';
import { alunoController } from '../controllers/aluno.controller';

const router = Router();

router.post('/', alunoController.create);
router.get('/', alunoController.getAll);           // ← LISTAR TODOS
router.get('/:id', alunoController.getById);       // ← VER POR ID
router.patch('/:id', alunoController.update);      // ← EDITAR
router.delete('/:id', alunoController.delete);     // ← EXCLUIR (opcional)

export default router;