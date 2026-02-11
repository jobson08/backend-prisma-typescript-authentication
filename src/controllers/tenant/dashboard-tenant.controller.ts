// src/controllers/tenant/dashboard-tenant.controller.ts
import { Request, Response } from 'express';
import { DashboardTenantService } from '../../services/tenant/dashboard-tenant.service';

const service = new DashboardTenantService();

export const getDashboardTenant = async (req: Request, res: Response) => {
  try {
    const { escolinhaId } = req;
    if (!escolinhaId) {
      return res.status(403).json({ error: 'Escolinha não identificada' });
    }

    const dashboard = await service.getDashboard(escolinhaId, req.query.mes as string);

    res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error: any) {
    console.error('[DashboardTenant] Erro:', error);
    res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
};


export const getAlunosInadimplentes = async (req: Request, res: Response) => {
  try {
    const { escolinhaId } = req;
    if (!escolinhaId) return res.status(403).json({ error: 'Escolinha não identificada' });

    const mes = req.query.mes as string;
    const data = await service.getAlunosInadimplentes(escolinhaId, mes);

    res.json({ success: true, data });
  } catch (err: any) {
    console.error('[getAlunosInadimplentes]', err);
    res.status(500).json({ error: 'Erro ao buscar inadimplentes' });
  }
};

export const getAniversariantesSemana = async (req: Request, res: Response) => {
  try {
    const { escolinhaId } = req;
    if (!escolinhaId) return res.status(403).json({ error: 'Escolinha não identificada' });

    const data = await service.getAniversariantesSemana(escolinhaId);

    res.json({ success: true, data });
  } catch (err: any) {
    console.error('[getAniversariantesSemana]', err);
    res.status(500).json({ error: 'Erro ao buscar aniversariantes' });
  }
};
