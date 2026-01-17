import { Request, Response } from 'express';
import { DashboardTenantService } from '../services/dashboard-tenant.service';

const service = new DashboardTenantService();

export const getDashboardTenant = async (req: Request, res: Response) => {
  try {
    const { escolinhaId } = req; // injetado pelo tenantGuard
    if (!escolinhaId) {
      return res.status(403).json({ error: 'Escolinha não identificada' });
    }

    const dashboard = await service.getDashboard(escolinhaId);

    res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error: any) {
    console.error('[DashboardTenant] Erro:', error);
    res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
};