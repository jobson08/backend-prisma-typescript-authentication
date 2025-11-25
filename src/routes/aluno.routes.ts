// src/routes/aluno.routes.ts (exemplo)
import { Router } from 'express';
import { prisma } from '../config/database';
import { authMiddleware } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

// TODAS as rotas do tenant passam por aqui
router.use(authMiddleware);        // 1º verifica o JWT
router.use(tenantMiddleware);      // 2º garante que só acessa o próprio tenant

router.get('/', async (req, res) => {
  const alunos = await prisma.aluno.findMany({
    where: { tenantId: req.tenantId }, // ← 100% seguro!
  });
  res.json(alunos);
});

export default router;