import { Request, Response, NextFunction } from 'express';

import { createFuncionarioSchema, updateFuncionarioSchema,} from '../../dto/tenant/funcionario.dto';
import { z } from 'zod';
import { prisma } from '../../config/database';
import bcrypt from 'bcrypt';
import { FuncionarioService } from '../../services/tenant/funcionario.service';

const service = new FuncionarioService();

//======================================criar funcionario=================================
// src/controllers/tenant/funcionario.controller.ts
export const createFuncionario = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const escolinhaId = req.escolinhaId!;
    const fotoFile = req.file;

    console.log('=== [CONTROLLER] Foto recebida:', fotoFile ? fotoFile.originalname : 'Nenhuma');

    // Conversão correta dos dados
    const data = {
      nome: req.body.nome?.trim(),
      cargo: req.body.cargo,
      salario: req.body.salario ? parseFloat(req.body.salario) : undefined,
      telefone: req.body.telefone?.trim(),
      cpf: req.body.cpf ? req.body.cpf.replace(/\D/g, '') : null,
      email: req.body.email?.trim().toLowerCase(),
      observacoes: req.body.observacoes?.trim() || null,
      password: req.body.password,
    };

    const result = await service.create(escolinhaId, data, fotoFile);

    res.status(201).json({
      success: true,
      message: 'Funcionário criado com sucesso',
      data: result.funcionario,
      senhaTemporaria: result.senhaTemporaria,
    });

  } catch (error: any) {
    console.error('[CONTROLLER CREATE FUNCIONARIO] Erro:', error);
    next(error); // Deixa o error middleware tratar
  }
};

//====================================Lista todos funcionario============================
export const listFuncionarios = async (req: Request, res: Response) => {
  try {
    const escolinhaId = req.escolinhaId!;
    const funcionarios = await service.list(escolinhaId);
    res.json({ success: true, data: funcionarios });
  } catch (error) {
    console.error('[ListFuncionarios] Erro:', error);
    res.status(500).json({ error: 'Erro ao listar funcionários' });
  }
};

//===============================Busacr funcionario po ID======================================
export const getFuncionarioById = async (req: Request, res: Response) => {
  try {
    const escolinhaId = req.escolinhaId!;
    const { id } = req.params;

    const funcionario = await service.findById(escolinhaId, id);
    res.json({ success: true, data: funcionario });
  } catch (error: any) {
    if (error.message.includes('não encontrado')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erro ao buscar funcionário' });
  }
};

//=================================Editar funcionario===========================
export const updateFuncionario = async (req: Request, res: Response) => {
  console.log('[CONTROLLER UPDATE FUNCIONARIO] Iniciando atualização');
  console.log('[CONTROLLER UPDATE FUNCIONARIO] ID do funcionário:', req.params.id);
  console.log('[CONTROLLER UPDATE FUNCIONARIO] Body recebido:', JSON.stringify(req.body, null, 2));

  try {
    const escolinhaId = req.escolinhaId!;
    const { id } = req.params;

    const data = updateFuncionarioSchema.parse(req.body);

    console.log('[CONTROLLER UPDATE FUNCIONARIO] Dados validados pelo Zod:', JSON.stringify(data, null, 2));

    const funcionarioAtualizado = await service.update(escolinhaId, id, data);

    console.log('[CONTROLLER UPDATE FUNCIONARIO] Funcionário atualizado com sucesso - ID:', id);

    res.json({
      success: true,
      message: 'Funcionário atualizado com sucesso',
      data: funcionarioAtualizado,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      console.error('[UPDATE FUNCIONARIO] Erro Zod:', error.issues);
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })),
      });
    }

    const message = error instanceof Error ? error.message : 'Erro interno ao atualizar funcionário';
    console.error('[UPDATE FUNCIONARIO] Erro completo:', message, error);
    res.status(500).json({ error: message });
  }
};

//=======================================Redefinir senha===============================
export const redefinirSenhaFuncionario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log('[REDEFINIR SENHA FUNCIONARIO] Iniciando - ID:', id);

    const funcionario = await prisma.funcionario.findUnique({
      where: { id },
      include: { user: true },
    });

    console.log('[REDEFINIR SENHA FUNCIONARIO] Funcionário encontrado:', funcionario ? 'sim' : 'não');
    console.log('[REDEFINIR SENHA FUNCIONARIO] User vinculado:', funcionario?.user ? 'sim (ID: ' + funcionario.user.id + ')' : 'não');

    if (!funcionario) {
      return res.status(404).json({ success: false, error: 'Funcionário não encontrado' });
    }

    if (!funcionario.user) {
      return res.status(400).json({
        success: false,
        error: 'Este funcionário não possui login associado',
      });
    }

    // Gera nova senha temporária
    const senhaTemporaria = Math.random().toString(36).slice(-12) + '!@#';
    const hashed = await bcrypt.hash(senhaTemporaria, 10);

    await prisma.user.update({
      where: { id: funcionario.user.id },
      data: { password: hashed },
    });

    console.log('[REDEFINIR SENHA FUNCIONARIO] Senha redefinida com sucesso para user ID:', funcionario.user.id);

    return res.json({
      success: true,
      message: 'Senha redefinida com sucesso',
      senhaTemporaria,
    });
  } catch (err: any) {
    console.error('[REDEFINIR SENHA FUNCIONARIO] Erro completo:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro ao redefinir senha',
    });
  }
};

//=====================================excluir funcionario=============================
export const deleteFuncionario = async (req: Request, res: Response) => {
  try {
    const escolinhaId = req.escolinhaId!;
    const { id } = req.params;

    await service.delete(escolinhaId, id);

    res.json({ success: true, message: 'Funcionário excluído com sucesso' });
  } catch (error: any) {
    console.error('[DeleteFuncionario] Erro:', error);
    res.status(500).json({ error: error.message || 'Erro ao excluir funcionário' });
  }
};

//=======================================buscar treinador  por role ===========================
export const listTreinadoresController = async (req: Request, res: Response) => {
  try {
    const treinadores = await prisma.funcionario.findMany({
      where: {
        escolinhaId: req.escolinhaId!,
        cargo: 'TREINADOR',
      },
      select: {
        id: true,
        nome: true,
        cargo: true,
      },
      orderBy: { nome: 'asc' },
    });

    return res.json({
      success: true,
      data: treinadores,
    });
  } catch (err) {
    console.error('[LIST_TREINADORES_ERROR]', err);
    return res.status(500).json({ success: false, error: 'Erro ao listar treinadores' });
  }
};