// src/routes/usuario.routes.ts
import { Router } from 'express';
import { usuarioController } from '../controllers/usuario.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Super Admin cria tenant + admin do tenant
router.post('/tenant', authMiddleware, usuarioController.createTenantWithAdmin);

// Outras rotas que você já tem
// router.get('/', ...)
// router.patch('/:id', ...)

export default router;