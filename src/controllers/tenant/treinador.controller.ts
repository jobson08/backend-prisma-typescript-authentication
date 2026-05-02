// src/controllers/tenant/treinador.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import bcrypt from 'bcrypt';
import { TreinadorService } from '../../services/tenant/treinador.service';
import { CreateTreinadorSchema, UpdateTreinadorSchema } from '../../dto/tenant/treinador.dto';

const service = new TreinadorService();

export const createTreinador = async (req: Request, res: Response) => {
  try {
    const escolinhaId = req.escolinhaId!;
    const fotoFile = req.file;

    const data = {
      nome: req.body.nome,
      email: req.body.email,
      telefone: req.body.telefone,
      dataNascimento: req.body.dataNascimento,
      observacoes: req.body.observacoes,
      password: req.body.password,
    };

    const result = await service.create(escolinhaId, data, fotoFile);

    res.status(201).json({
      success: true,
      message: 'Treinador criado com sucesso',
      data: result.treinador,
      senhaTemporaria: result.senhaTemporaria,
    });
  } catch (error: any) {
    console.error('[CREATE TREINADOR] Erro:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar treinador' });
  }
};

export const listTreinadores = async (req: Request, res: Response) => {
  try {
    const escolinhaId = req.escolinhaId!;
    const treinadores = await service.list(escolinhaId);
    res.json({ success: true, data: treinadores });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getTreinadorById = async (req: Request, res: Response) => {
  try {
    const escolinhaId = req.escolinhaId!;
    const { id } = req.params;
    const treinador = await service.findById(escolinhaId, id);
    res.json({ success: true, data: treinador });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

export const updateTreinador = async (req: Request, res: Response) => {
  try {
    const escolinhaId = req.escolinhaId!;
    const { id } = req.params;
    const data = UpdateTreinadorSchema.parse(req.body);
    const treinador = await service.update(escolinhaId, id, data);
    res.json({ success: true, data: treinador });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ====================== REDEFINIR SENHA ======================
export const redefinirSenhaTreinador = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log('[REDEFINIR SENHA TREINADOR] Iniciando - ID:', id);

    const treinador = await prisma.treinador.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!treinador) {
      console.log('[REDEFINIR SENHA TREINADOR] Treinador não encontrado');
      return res.status(404).json({ success: false, error: 'Treinador não encontrado' });
    }

    if (!treinador.user) {
      console.log('[REDEFINIR SENHA TREINADOR] Sem user vinculado');
      return res.status(400).json({
        success: false,
        error: 'Este treinador não possui login associado',
      });
    }

    const senhaTemporaria = Math.random().toString(36).slice(-12) + '!@#';
    const hashed = await bcrypt.hash(senhaTemporaria, 10);

    await prisma.user.update({
      where: { id: treinador.user.id },
      data: { password: hashed },
    });

    console.log('[REDEFINIR SENHA TREINADOR] Senha redefinida com sucesso para user ID:', treinador.user.id);

    return res.json({
      success: true,
      message: 'Senha redefinida com sucesso',
      senhaTemporaria,
    });
  } catch (err: any) {
    console.error('[REDEFINIR SENHA TREINADOR] Erro:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro ao redefinir senha',
    });
  }
};

export const deleteTreinador = async (req: Request, res: Response) => {
  try {
    const escolinhaId = req.escolinhaId!;
    const { id } = req.params;
    await service.delete(escolinhaId, id);
    res.json({ success: true, message: 'Treinador excluído' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};