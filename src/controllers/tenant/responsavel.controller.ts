// src/controllers/responsavel.controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database';
import bcrypt from 'bcrypt';
import { createResponsavelSchema, updateResponsavelSchema } from '../../dto/tenant/responsavel.dto';
import { ResponsavelService } from '../../services/tenant/responsavel.service';

const service = new ResponsavelService();

export const createResponsavel = async (req: Request, res: Response) => {
  console.log('[CONTROLLER CREATE RESPONSAVEL] Iniciando criação');
  console.log('[CONTROLLER CREATE RESPONSAVEL] Body recebido:', JSON.stringify(req.body, null, 2));

  try {
    const escolinhaId = req.escolinhaId!;
    const data = createResponsavelSchema.parse(req.body);

    console.log('[CONTROLLER CREATE RESPONSAVEL] Dados validados:', JSON.stringify(data, null, 2));

    const result = await service.create(escolinhaId, data);

    console.log('[CONTROLLER CREATE RESPONSAVEL] Resultado:', JSON.stringify(result, null, 2));

    res.status(201).json({
      success: true,
      message: 'Responsável criado com sucesso',
      data: result.responsavel,
      senhaTemporaria: result.senhaTemporaria,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      console.error('[CREATE RESPONSAVEL] Erro Zod:', error.issues);
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })),
      });
    }

    const message = error instanceof Error ? error.message : 'Erro interno ao criar responsável';
    console.error('[CREATE RESPONSAVEL] Erro:', message, error);
    res.status(500).json({ error: message });
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

//-----------------------------Editar Responsavel--------------------------------

// src/controllers/tenant/responsavel.controller.ts
export const updateResponsavel = async (req: Request, res: Response) => {
  console.log('[CONTROLLER UPDATE RESPONSAVEL] Iniciando atualização');
  console.log('[CONTROLLER UPDATE RESPONSAVEL] ID do responsável:', req.params.id);
  console.log('[CONTROLLER UPDATE RESPONSAVEL] Body recebido:', JSON.stringify(req.body, null, 2));

  try {
    const escolinhaId = req.escolinhaId!;
    const { id } = req.params;

    const data = updateResponsavelSchema.parse(req.body);

    console.log('[CONTROLLER UPDATE RESPONSAVEL] Dados validados:', JSON.stringify(data, null, 2));

    const responsavelAtualizado = await service.update(escolinhaId, id, data);

    console.log('[CONTROLLER UPDATE RESPONSAVEL] Responsável atualizado com sucesso - ID:', id);

    res.json({
      success: true,
      message: 'Responsável atualizado com sucesso',
      data: responsavelAtualizado,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      console.error('[UPDATE RESPONSAVEL] Erro Zod:', error.issues);
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })),
      });
    }

    const message = error instanceof Error ? error.message : 'Erro interno ao atualizar responsável';
    console.error('[UPDATE RESPONSAVEL] Erro completo:', message, error);
    res.status(500).json({ error: message });
  }
};

//-------------------------Redefinir senha Responsavel-------------------------
export const redefinirSenhaResponsavel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log('[REDEFINIR SENHA RESPONSAVEL] Iniciando - ID:', id);

    const responsavel = await prisma.responsavel.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!responsavel) {
      console.log('[REDEFINIR SENHA RESPONSAVEL] Responsável não encontrado');
      return res.status(404).json({ success: false, error: 'Responsável não encontrado' });
    }

    if (!responsavel.user) {
      console.log('[REDEFINIR SENHA RESPONSAVEL] Sem user vinculado');
      return res.status(400).json({
        success: false,
        error: 'Este responsável não possui login associado',
      });
    }

    const senhaTemporaria = Math.random().toString(36).slice(-12) + '!@#';
    const hashed = await bcrypt.hash(senhaTemporaria, 10);

    await prisma.user.update({
      where: { id: responsavel.user.id },
      data: { password: hashed },
    });

    console.log('[REDEFINIR SENHA RESPONSAVEL] Senha redefinida com sucesso para user ID:', responsavel.user.id);

    return res.json({
      success: true,
      message: 'Senha redefinida com sucesso',
      senhaTemporaria,
    });
  } catch (err: any) {
    console.error('[REDEFINIR SENHA RESPONSAVEL] Erro:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro ao redefinir senha',
    });
  }
};

//------------------------detele------------------------------------------
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