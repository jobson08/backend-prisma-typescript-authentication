// src/controllers/tenant/treinoRecorrente.controller.ts
import { Request, Response } from 'express';
import { TreinoRecorrenteService } from '../../services/tenant/treinoRecorrente.service';
import { AppError } from '../../utils/AppError';

const service = new TreinoRecorrenteService();

export const createTreinoRecorrente = async (req: Request, res: Response) => {
  try {
    const alunoId = req.user?.alunoFutebolId; // não é necessário aqui, mas mantido para consistência

    const treino = await service.create(req.body, req.escolinhaId!);

    return res.status(201).json({
      success: true,
      data: treino,
      message: 'Treino recorrente criado com sucesso'
    });
  } catch (error: any) {
    console.error('[createTreinoRecorrente] Erro:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
};

export const listTreinosRecorrentes = async (req: Request, res: Response) => {
  try {
    const treinos = await service.listByEscolinha(req.escolinhaId!);

    return res.status(200).json({
      success: true,
      data: treinos,
    });
  } catch (error: any) {
    console.error('[listTreinosRecorrentes] Erro:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const getTreinoRecorrenteById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const treino = await service.getById(id, req.escolinhaId!);

    return res.status(200).json({
      success: true,
      data: treino,
    });
  } catch (error: any) {
    console.error('[getTreinoRecorrenteById] Erro:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
};

export const generateTreinosMes = async (req: Request, res: Response) => {
  try {
    const { mes } = req.query; // formato: "2025-04"

    if (!mes) {
      return res.status(400).json({ error: "Parâmetro 'mes' (YYYY-MM) é obrigatório" });
    }

    const treinos = await service.generateTreinosMes(req.escolinhaId!, mes as string);

    return res.status(200).json({
      success: true,
      data: treinos,
    });
  } catch (error: any) {
    console.error('[generateTreinosMes] Erro:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const updateTreinoRecorrente = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const treino = await service.update(id, data, req.escolinhaId!);

    return res.status(200).json({
      success: true,
      data: treino,
      message: 'Treino recorrente atualizado com sucesso'
    });
  } catch (error: any) {
    console.error('[updateTreinoRecorrente] Erro:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
};

export const deleteTreinoRecorrente = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await service.delete(id, req.escolinhaId!);

    return res.status(200).json({
      success: true,
      message: 'Treino recorrente excluído com sucesso'
    });
  } catch (error: any) {
    console.error('[deleteTreinoRecorrente] Erro:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
};