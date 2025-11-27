import { Request, Response } from 'express';
import { tenantService } from '../services/tenant.service';

export const tenantController = {
    async getAllTenants(req: Request, res: Response) {
  try {
    // Só Super Admin pode ver todos
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado. Apenas Super Admin.',
      });
    }

    const tenants = await tenantService.getAllTenants();

    return res.json({
      success: true,
      count: tenants.length,
      data: tenants,
    });
  } catch (error: any) {
    console.error('Erro ao listar tenants:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
},

//EDITAR O TENANT
async updateTenant(req: Request, res: Response) {
    try {
      const { id } = req.params; // tenantId vem da URL
      const userRole = req.user.role;

      if (userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Apenas Super Admin pode editar tenants',
        });
      }

      const result = await tenantService.updateTenant(id, req.body);

      return res.json(result);
    } catch (error: any) {
      if (error.code === 'P2025') { // tenant não encontrado
        return res.status(404).json({
          success: false,
          error: 'Tenant não encontrado',
        });
      }

      console.error('Erro ao editar tenant:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  },

  //VERIFICAR TENANT POR ID
 async getTenantById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado. Apenas Super Admin.',
        });
      }

      const result = await tenantService.getTenantById(id);
      return res.json(result);
    } catch (error: any) {
      if (error.message === 'Tenant não encontrado') {
        return res.status(404).json({ success: false, error: 'Tenant não encontrado' });
      }
      console.error('Erro ao buscar tenant:', error);
      return res.status(500).json({ success: false, error: 'Erro interno' });
    }
  },

  //DELETAR TENANT
 /* async deleteTenant(req: Request, res: Response) {
    try {
      const { id } = req.params;

    // Só Super Admin pode deletar
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado. Apenas Super Admin pode excluir tenants.',
      });
    }
      // CONFIRMAÇÃO OBRIGATÓRIA (segurança extra!)
    const confirm = req.query.confirm === 'true';
    if (!confirm) {
      return res.status(400).json({
        success: false,
        error: 'Confirmação necessária',
        warning: 'Esta ação é IRREVERSÍVEL. Todos os dados do tenant serão apagados.',
        hint: 'Adicione ?confirm=true na URL para confirmar',
      });
    }

    const result = await tenantService.deleteTenant(id);

    return res.json(result);

    } catch (error: any) {
      if (error.message === 'Tenant não encontrado') {
      return res.status(404).json({
      success: false,
      error: 'Tenant não encontrado',
    });

      console.error('Erro ao deletar tenant:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao excluir tenant',
    });

     }

   }
  },
*/
};
