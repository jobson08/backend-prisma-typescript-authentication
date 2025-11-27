// src/routes/responsavel.routes.ts
import { Router } from 'express';
import { responsavelController } from '../controllers/responsavel.controller';

const router = Router();

router.post('/', responsavelController.create);
router.get('/', responsavelController.getAll);
router.get('/:id', responsavelController.getById);
router.patch('/:id', responsavelController.update);
router.delete('/:id', responsavelController.delete);

export default router;