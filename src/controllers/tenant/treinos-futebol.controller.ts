// src/controllers/tenant/treinos-futebol.controller.ts

import { Request, Response } from 'express';
import { z } from 'zod';
import { TreinosFutebolService } from '../../services/tenant/treinos-futebol.service';
import { createTreinoSchema } from '../../dto/tenant/treinos-futebol.dto';
import { prisma } from '../../config/database';
// ajuste o caminho se o schema estiver em outro lugar

const service = new TreinosFutebolService();

export const createTreinoFutebolController = async (req: Request, res: Response) => {
  try {
    const dto = createTreinoSchema.parse(req.body);

    const treino = await service.createTreino(req.escolinhaId!, dto);

    return res.status(201).json({
      success: true,
      data: treino,
      message: 'Treino criado com sucesso',
    });
  } /*catch (err) {
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Dados inválidos',
      details: (err as z.ZodError).errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }*/
  catch (err) {
    console.error('[CREATE TREINO CONTROLLER ERROR FULL]', err);
 //   console.error('[STACK]', err.stack || 'Sem stack trace');
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Dados inválidos',
      details: err.issues,
    });
  }

  // Qualquer outro erro
  console.error('[CREATE TREINO FUTEBOL CONTROLLER ERROR]', err);
  return res.status(500).json({
    success: false,
    error: 'Erro interno ao criar treino',
    message: err instanceof Error ? err.message : 'Erro desconhecido',
  });
}
};

export const listTreinosFutebolController= async (req: Request, res: Response) => {
  try {
    const treinos = await prisma.treino.findMany({
      where: { escolinhaId: req.escolinhaId! },
      include: {
        funcionarioTreinador: { select: { nome: true } }, // traz o nome do treinador
      },
      orderBy: { data: 'desc' },
    });

    // Opcional: formate a data como string YYYY-MM-DD (evita problemas de fuso no frontend)
    const treinosFormatados = treinos.map(t => ({
      ...t,
      data: t.data.toISOString().split('T')[0], // "2026-02-20"
    }));

    return res.status(200).json({
      success: true,
      data: treinosFormatados,
    });
  } catch (err: any) {
    console.error('[LIST TREINOS ERROR]', err);
    return res.status(500).json({
      success: false,
      error: 'Erro ao listar treinos',
      message: err.message || 'Erro desconhecido',
    });
  }
};

// Se quiser get by id, update, delete...
export const getTreinoByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const treino = await prisma.treino.findUnique({
      where: { id },
      include: { funcionarioTreinador: { select: { nome: true } } },
    });

    if (!treino) {
      return res.status(404).json({
        success: false,
        error: 'Treino não encontrado',
      });
    }

    // Verifica se pertence à escolinha do usuário
    if (treino.escolinhaId !== req.escolinhaId) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado',
      });
    }

    const treinoFormatado = {
  ...treino,
  data: treino.data.toISOString().split('T')[0],  // "2026-02-20"
};

    return res.status(200).json({
      success: true,
      data: treinoFormatado,
    });
  } catch (err: any) {
    console.error('[GET TREINO BY ID ERROR]', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
};

export const editeTreinoFutebolController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const dto = req.body;

  const treino = await prisma.treino.update({
    where: { id },
    data: {
      nome: dto.nome,
      categoria: dto.categoria,
      data: new Date(dto.data + 'T00:00:00.000Z'), // evita fuso
      horaInicio: dto.horaInicio,
      horaFim: dto.horaFim,
      funcionarioTreinadorId: dto.funcionarioTreinadorId,
      local: dto.local,
      descricao: dto.descricao,
    },
  });

  res.json({ success: true, data: treino });
}

