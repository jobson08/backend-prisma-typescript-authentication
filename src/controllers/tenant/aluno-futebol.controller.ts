import { Request, Response } from 'express';

import { z } from 'zod';
import { createAlunoSchema, updateAlunoSchema } from '../../dto/tenant/aluno-futebol.dto';
import { AlunoService } from '../../services/tenant/aluno-futebol.service';

const service = new AlunoService();

export const createAluno = async (req: Request, res: Response) => {
  try {
    const escolinhaId = req.escolinhaId!;
    const data = createAlunoSchema.parse(req.body);

    // Normaliza email se fornecido
    if (data.email) {
      data.email = data.email.toLowerCase().trim();
    }

    // dataNascimento é obrigatório no DTO → já vem como Date (não null)
    // Não precisa de ?? null aqui, pois Zod já garante que veio
    if (!data.dataNascimento) {
      return res.status(400).json({
        error: 'Data de nascimento é obrigatória',
      });
    }

    const aluno = await service.create(escolinhaId, data);

    res.status(201).json({
      success: true,
      message: 'Aluno criado com sucesso',
      data: aluno,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.issues.map(i => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    // Captura erro específico de data inválida (se o frontend enviar string ruim)
    if (error instanceof Error && error.message.includes('Invalid time value')) {
      return res.status(400).json({
        error: 'Data de nascimento inválida',
        details: 'Formato esperado: data válida (YYYY-MM-DD ou parseável)',
      });
    }

    console.error('[CreateAluno] Erro completo:', error);
    res.status(500).json({ error: 'Erro interno ao criar aluno' });
  }
};

export const listAlunos = async (req: Request, res: Response) => {
  try {
    const escolinhaId = req.escolinhaId!;
    const alunos = await service.list(escolinhaId);
    res.json({ success: true, data: alunos });
  } catch (error) {
    console.error('[ListAlunos] Erro:', error);
    res.status(500).json({ error: 'Erro ao listar alunos' });
  }
};

export const getAlunoById = async (req: Request, res: Response) => {
  try {
    const escolinhaId = req.escolinhaId!;
    const { id } = req.params;

    const aluno = await service.findById(escolinhaId, id);
    res.json({ success: true, data: aluno });
  } catch (error: any) {
    if (error.message.includes('não encontrado')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erro ao buscar aluno' });
  }
};

export const updateAluno = async (req: Request, res: Response) => {
  try {
    const escolinhaId = req.escolinhaId!;
    const { id } = req.params;
    const data = updateAlunoSchema.parse(req.body);

    if (data.email) {
      data.email = data.email.toLowerCase().trim();
    }

    const aluno = await service.update(escolinhaId, id, data);

    res.json({
      success: true,
      message: 'Aluno atualizado com sucesso',
      data: aluno,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.issues,
      });
    }
    console.error('[UpdateAluno] Erro:', error);
    res.status(500).json({ error: 'Erro ao atualizar aluno' });
  }
};

export const deleteAluno = async (req: Request, res: Response) => {
  try {
    const escolinhaId = req.escolinhaId!;
    const { id } = req.params;

    await service.delete(escolinhaId, id);

    res.json({ success: true, message: 'Aluno excluído com sucesso' });
  } catch (error: any) {
    console.error('[DeleteAluno] Erro:', error);
    res.status(500).json({ error: error.message || 'Erro ao excluir aluno' });
  }
};