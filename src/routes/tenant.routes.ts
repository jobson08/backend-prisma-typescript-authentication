// src/routes/usuario.routes.ts
import { Router } from 'express';
import { tenantController } from '../controllers/tenant.controler';

// ... suas rotas existentes

const router = Router();
// Listar todos os tenants (SÓ SUPER ADMIN)
router.get('/', tenantController.getAllTenants);//api/tenants

// Editar tenant (SÓ SUPER ADMIN)
router.patch('/:id', tenantController.updateTenant); //api/tenants/Id

// VERIFICAR tenant (SÓ SUPER ADMIN)
router.get('/:id', tenantController.getTenantById); //api/tenants/Id

//ATIVAR OU BLOQUEAR TENANT (SÓ SUPER ADMIN)
router.post('/:id/block', tenantController.toggleBlockTenant);//api/tenants/Id/block

//DELETAR TENANT (SÓ SUPER ADMIN)
//router.delete('/:id', tenantController.deleteTenant); //api/tenants/Id?confirm=true

//editar usuario tenant
router.patch('/:tenantId/admin-usuario', tenantController.editarAdminUsuario); //api/tenants/tenantID/admin-usuario

//buscar tenant com usuario ID
router.get('/:tenantId/admin-usuario', tenantController.getAdminUsuario); //api/tenants/tenantID/admin-usuario


export default router;