// src/controllers/tenant/aula-extra.controller.ts
import { Request, Response } from 'express';
import { aulaExtraService } from '../../services/tenant/aula-extra.service';
import { z } from 'zod';
import {
  createAulaExtraSchema,
  updateAulaExtraSchema,
  updateAulasExtrasConfigSchema,
} from '../../dto/tenant/aulas-extras.dto';

export class AulaExtraController {
  async create(req: Request, res: Response) {
    try {
      const escolinhaId = req.escolinhaId!;
      const data = createAulaExtraSchema.parse(req.body);

      console.log('[CONTROLLER] Criando Aula Extra:', { escolinhaId, ...data });

      const aula = await aulaExtraService.create(escolinhaId, data);

      return res.status(201).json({
        success: true,
        message: 'Aula Extra criada com sucesso',
        data: aula,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
      }
      console.error('[CREATE AULA EXTRA ERROR]', error);
      return res.status(500).json({ error: 'Erro ao criar aula extra' });
    }
  }


  async update(req: Request, res: Response) {
    try {
      const escolinhaId = req.escolinhaId!;
      const { id } = req.params;
      const data = updateAulaExtraSchema.parse(req.body);

      console.log('[CONTROLLER] Atualizando Aula Extra:', { escolinhaId, ...data });

      const aula = await aulaExtraService.update(id, escolinhaId, data);

      return res.json({
        success: true,
        message: 'Aula Extra atualizada',
        data: aula,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
      }
      console.error('[UPDATE AULA EXTRA ERROR]', error);
      return res.status(500).json({ error: 'Erro ao atualizar aula extra' });
    }
  }

async delete(req: Request, res: Response) {
  try {
    const escolinhaId = req.escolinhaId!;
    const { id } = req.params;

    await aulaExtraService.delete(id, escolinhaId);

    return res.json({
      success: true,
      message: 'Aula Extra excluída com sucesso',
    });
  } catch (error: any) {
    console.error('[DELETE AULA EXTRA ERROR]', error);
    return res.status(500).json({ error: 'Erro ao excluir aula extra' });
  }
}

async getAll(req: Request, res: Response) {
  try {
    const escolinhaId = req.escolinhaId!;
    const aulas = await aulaExtraService.getAll(escolinhaId);
    return res.json({ success: true, data: aulas });
  } catch (error: any) {
    console.error('[GET ALL AULAS EXTRAS ERROR]', error);
    return res.status(500).json({ error: 'Erro ao listar aulas extras' });
  }
}

  async getById(req: Request, res: Response) {
    try {
      const escolinhaId = req.escolinhaId!;
      const { id } = req.params;
      const aula = await aulaExtraService.getById(id, escolinhaId);
      if (!aula) return res.status(404).json({ error: 'Aula Extra não encontrada' });
      return res.json({ success: true, data: aula });
    } catch (error: any) {
      console.error('[GET BY ID AULA EXTRA ERROR]', error);
      return res.status(500).json({ error: 'Erro ao buscar aula extra' });
    }
  }

  async updateAulasExtrasConfig(req: Request, res: Response) {
    try {
      const escolinhaId = req.escolinhaId!;

      console.log('[CONTROLLER] Payload recebido (Aulas Extras Config):', req.body);

      const data = updateAulasExtrasConfigSchema.parse(req.body);

      console.log('[CONTROLLER] Dados validados (Aulas Extras Config):', data);

      const result = await aulaExtraService.updateAulasExtrasConfig(escolinhaId, data);

      return res.json({
        success: true,
        message: 'Configuração de Aulas Extras atualizada',
        data: result,
      });
    } catch (error: any) {
      console.error('[UPDATE AULAS EXTRAS CONFIG ERROR]', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
      }
      return res.status(500).json({ error: 'Erro ao atualizar configuração de aulas extras' });
    }
  }
}

export const aulaExtraController = new AulaExtraController();