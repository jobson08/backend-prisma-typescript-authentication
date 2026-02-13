// src/controllers/tenant/dashboard-tenant.controller.ts
import { Request, Response } from 'express';
import { DashboardTenantService } from '../../services/tenant/dashboard-tenant.service';

const service = new DashboardTenantService();

// Função auxiliar para validar formato YYYY-MM
const isValidMes = (mes?: string): boolean => {
  return !!mes && /^\d{4}-\d{2}$/.test(mes);
};

export const getDashboardTenant = async (req: Request, res: Response) => {
  try {
    const { escolinhaId } = req;
    if (!escolinhaId) {
      return res.status(403).json({ error: 'Escolinha não identificada' });
    }

    const mes = req.query.mes as string | undefined;

    // Validação simples do mês
    if (mes && !isValidMes(mes)) {
      return res.status(400).json({ error: 'Formato de mês inválido. Use YYYY-MM (ex: 2026-02)' });
    }

    const dashboard = await service.getDashboard(escolinhaId, mes);

    return res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error: unknown) {
    console.error('[getDashboardTenant] Erro:', error);
    const message = error instanceof Error ? error.message : 'Erro interno';
    return res.status(500).json({ error: message });
  }
};

export const getAlunosInadimplentes = async (req: Request, res: Response) => {
  try {
    const { escolinhaId } = req;
    if (!escolinhaId) {
      return res.status(403).json({ error: 'Escolinha não identificada' });
    }

    const mes = req.query.mes as string | undefined;

    // Validação do mês (obrigatório para inadimplentes)
    if (!mes || !isValidMes(mes)) {
      return res.status(400).json({ error: 'Parâmetro "mes" obrigatório no formato YYYY-MM (ex: 2026-02)' });
    }

    const data = await service.getAlunosInadimplentes(escolinhaId, mes);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    console.error('[getAlunosInadimplentes] Erro:', error);
    const message = error instanceof Error ? error.message : 'Erro interno';
    return res.status(500).json({ error: message });
  }
};

export const getAniversariantesSemana = async (req: Request, res: Response) => {
  try {
    const { escolinhaId } = req;
    if (!escolinhaId) {
      return res.status(403).json({ error: 'Escolinha não identificada' });
    }

    const data = await service.getAniversariantesSemana(escolinhaId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    console.error('[getAniversariantesSemana] Erro:', error);
    const message = error instanceof Error ? error.message : 'Erro interno';
    return res.status(500).json({ error: message });
  }
};