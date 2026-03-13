// src/controllers/tenant/aula-extra-aluno.controller.ts
import { Request, Response } from 'express';

import { z } from 'zod';
import {
  createAulaExtraAlunoSchema,
  updateAulaExtraAlunoSchema,
  aulaExtraAlunoIdSchema,
} from '../../dto/tenant/aulas-extras-alunos-professor.dto';
import { aulaExtraAlunoService } from '../../services/tenant/aula-extra-alunos-professor.service';

export class AulaExtraAlunoController {
  async create(req: Request, res: Response) {
    try {
      const data = createAulaExtraAlunoSchema.parse(req.body);

      console.log('[CONTROLLER] Criando inscrição Aula Extra Aluno:', data);

      const inscricao = await aulaExtraAlunoService.create(data);

      return res.status(201).json({
        success: true,
        message: 'Inscrição criada com sucesso',
        data: inscricao,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
      }
      console.error('[CREATE AULA EXTRA ALUNO ERROR]', error);
      return res.status(500).json({ error: 'Erro ao criar inscrição' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = updateAulaExtraAlunoSchema.parse(req.body);

      console.log('[CONTROLLER] Atualizando inscrição Aula Extra Aluno:', { ...data });

      const inscricao = await aulaExtraAlunoService.update(id, data);

      return res.json({
        success: true,
        message: 'Inscrição atualizada',
        data: inscricao,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
      }
      console.error('[UPDATE AULA EXTRA ALUNO ERROR]', error);
      return res.status(500).json({ error: 'Erro ao atualizar inscrição' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await aulaExtraAlunoService.delete(id);

      return res.json({
        success: true,
        message: 'Inscrição excluída com sucesso',
      });
    } catch (error: any) {
      console.error('[DELETE AULA EXTRA ALUNO ERROR]', error);
      return res.status(500).json({ error: 'Erro ao excluir inscrição' });
    }
  }

  async getAllByAula(req: Request, res: Response) {
    try {
      const { aulaExtraId } = req.params;

      const inscricoes = await aulaExtraAlunoService.getAllByAula(aulaExtraId);

      return res.json({ success: true, data: inscricoes });
    } catch (error: any) {
      console.error('[GET ALL INSCRICOES AULA EXTRA ERROR]', error);
      return res.status(500).json({ error: 'Erro ao listar inscrições' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const inscricao = await aulaExtraAlunoService.getById(id);
      if (!inscricao) return res.status(404).json({ error: 'Inscrição não encontrada' });
      return res.json({ success: true, data: inscricao });
    } catch (error: any) {
      console.error('[GET BY ID AULA EXTRA ALUNO ERROR]', error);
      return res.status(500).json({ error: 'Erro ao buscar inscrição' });
    }
  }
}

export const aulaExtraAlunoController = new AulaExtraAlunoController();