import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from './auth.middleware';

const router = Router();

router.post('/login', AuthController.login);
router.get('/me', authenticate, AuthController.me); // ← protegida

//ALTERAR SENHA DO SUPER ADMIN
router.patch('/change-password', authenticate, AuthController.changePassword); // ← protegida

export default router;