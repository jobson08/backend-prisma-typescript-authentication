// src/controllers/tenant/financeiro.controller.ts
import { Request, Response } from 'express';
import { getFinanceiroMensal } from '../../services/tenant/financeiro.service';

export const getFinanceiroMensalController = async (req: Request, res: Response) => {
  try {
    const escolinhaId = req.escolinhaId;
    if (!escolinhaId) {
      return res.status(401).json({
        success: false,
        error: "Escolinha não identificada no token",
      });
    }

    const { mes } = req.validatedQuery as { mes: string };

    if (!mes) {
      return res.status(400).json({
        success: false,
        error: "Parâmetro 'mes' é obrigatório",
      });
    }

    console.log(`[FINANCEIRO] Buscando dados para escolinha: ${escolinhaId} | mês: ${mes}`);

    const data = await getFinanceiroMensal(escolinhaId, mes);

    res.json({ success: true, data });
  } catch (error: any) {
    console.error("[FINANCEIRO CONTROLLER] Erro detalhado:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    res.status(500).json({
      success: false,
      error: error.message || "Erro interno ao buscar dados financeiros",
    });
  }
};