// src/routes/responsavel.routes.ts
import { Router } from 'express';
import { responsavelController } from '../controllers/responsavel.controller';

const router = Router();

router.post('/', responsavelController.create); //api/responsaveis
router.get('/', responsavelController.getAll); //api/responsaveis
router.get('/:id', responsavelController.getById); //api/responsaveis/resposavelID
router.patch('/:id', responsavelController.update);//api/responsaveis/resposavelID
router.delete('/:id', responsavelController.delete);

//rota criação de usuario responsavel
router.post('/:id/criar-usuario', responsavelController.criarUsuario);//api/responsaveis/resposavelID/criar-usuario
//editar usuario responsavel
router.patch('/:id/usuario', responsavelController.editarUsuario);//api/responsaveis/resposavelID/usuario
//buscar responsavel com usuario id
router.get('/:id/tem-usuario', responsavelController.temUsuario);//api/responsaveis/resposavelID/criar-usuario

export default router;