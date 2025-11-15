import { Router } from 'express';
import { TenantController } from './tenant.controller';

const router = Router();


router.post('/tenants/register', TenantController.create);
router.get('/tenants/:id', TenantController.getById);
router.get('/tenants', TenantController.getAll);
router.get('/tenants/:slug', TenantController.getBySlug);

export default router;