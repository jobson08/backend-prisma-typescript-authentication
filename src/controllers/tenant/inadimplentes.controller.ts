// src/controllers/tenant/inadimplentes.controller.ts
import { Request, Response } from 'express';
import { getInadimplentes } from '../../services/tenant/inadimplentes.service';
import { InadimplentesQuerySchema } from '../../dto/tenant/inadimplentes.dto';

export const getInadimplentesController = async (req: Request, res: Response) => {
  try {
    const escolinhaId = req.escolinhaId!;
    const validatedQuery = (req as any).validatedQuery;

    if (!validatedQuery?.ano) {
      return res.status(400).json({
        success: false,
        error: "Parâmetro 'ano' é obrigatório (yyyy)"
      });
    }

    const inadimplentes = await getInadimplentes(escolinhaId, validatedQuery.ano);

    const totalDevido = inadimplentes.reduce((sum, i) => sum + i.valorDevido, 0);

    res.json({
      success: true,
      data: inadimplentes,
      total: inadimplentes.length,
      totalDevido,
    });

  } catch (error: any) {
    console.error("[INADIMPLENTES CONTROLLER] Erro:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar lista de inadimplentes"
    });
  }
};