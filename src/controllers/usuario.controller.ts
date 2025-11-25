// src/controllers/usuario.controller.ts
import { Request, Response } from 'express';
import { usuarioService } from '../services/usuario.service';
import { createTenantWithAdminSchema, CreateTenantWithAdminDto } from '../dto/create-tenant-with-admin.dto';

export const usuarioController = {
  async createTenantWithAdmin(req: Request, res: Response) {
    try {
      // 1. Pega o usuário autenticado
      const userId = req.user.id;
      const userRole = req.user.role;

      // 2. Validação com Zod (perfeita e sem erro!)
      const dto = createTenantWithAdminSchema.parse(req.body);

      // 3. Chama o service
      const result = await usuarioService.createTenantWithAdmin(dto, userId);

      return res.status(201).json({
        success: true,
        message: 'Tenant criado com sucesso!',
        data: result,
      });

    } catch (error: any) {
      // Erro do Zod (validação)
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: error.errors.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      // Erro de permissão
      if (error.message.includes('Super Admin')) {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado',
          details: error.message,
        });
      }

      // Erro genérico
      console.error('Erro:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  },
};