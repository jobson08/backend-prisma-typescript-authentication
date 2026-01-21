// src/controllers/responsavel.controller.ts
import { Request, Response } from 'express';

import { z } from 'zod';
import { createResponsavelSchema, updateResponsavelSchema } from '../../dto/tenant/responsavel.dto';
import { ResponsavelService } from '../../services/tenant/responsavel.service';

const service = new ResponsavelService();

export const createResponsavel = async (req: Request, res: Response) => {
  try {
    const escolinhaId = req.escolinhaId!;
    const data = createResponsavelSchema.parse(req.body);

    // Normaliza email se fornecido
    if (data.email) {
      data.email = data.email.toLowerCase().trim();
    }

    const responsavel = await service.create(escolinhaId, data);

    res.status(201).json({
      success: true,
      message: 'Responsável criado com sucesso',
      data: responsavel,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.issues,
      });
    }
    console.error('[CreateResponsavel] Erro:', error);
    res.status(500).json({ error: 'Erro ao criar responsável' });
  }
};

export const listResponsaveis = async (req: Request, res: Response) => {
  try {
    const escolinhaId = req.escolinhaId!;
    const responsaveis = await service.list(escolinhaId);
    res.json({ success: true, data: responsaveis });
  } catch (error) {
    console.error('[ListResponsaveis] Erro:', error);
    res.status(500).json({ error: 'Erro ao listar responsáveis' });
  }
};

export const getResponsavelById = async (req: Request, res: Response) => {
  try {
    const escolinhaId = req.escolinhaId!;
    const { id } = req.params;

    const responsavel = await service.findById(escolinhaId, id);
    res.json({ success: true, data: responsavel });
  } catch (error: any) {
    if (error.message.includes('não encontrado')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erro ao buscar responsável' });
  }
};

export const updateResponsavel = async (req: Request, res: Response) => {
  try {
    const escolinhaId = req.escolinhaId!;
    const { id } = req.params;
    const data = updateResponsavelSchema.parse(req.body);

    // Normaliza email se fornecido
    if (data.email) {
      data.email = data.email.toLowerCase().trim();
    }

    const responsavel = await service.update(escolinhaId, id, data);

    res.json({
      success: true,
      message: 'Responsável atualizado com sucesso',
      data: responsavel,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.issues,
      });
    }
    console.error('[UpdateResponsavel] Erro:', error);
    res.status(500).json({ error: 'Erro ao atualizar responsável' });
  }
};

export const deleteResponsavel = async (req: Request, res: Response) => {
  try {
    const escolinhaId = req.escolinhaId!;
    const { id } = req.params;

    await service.delete(escolinhaId, id);

    res.json({ success: true, message: 'Responsável excluído com sucesso' });
  } catch (error: any) {
    console.error('[DeleteResponsavel] Erro:', error);
    res.status(500).json({ error: error.message || 'Erro ao excluir responsável' });
  }
};