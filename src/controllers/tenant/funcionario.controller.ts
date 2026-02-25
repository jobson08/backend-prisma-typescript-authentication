import { Request, Response } from 'express';

import { createFuncionarioSchema, updateFuncionarioSchema,} from '../../dto/tenant/funcionario.dto';
import { z } from 'zod';
import { prisma } from '../../config/database';
import bcrypt from 'bcrypt';
import { FuncionarioService } from '../../services/tenant/funcionario.service';

const service = new FuncionarioService();

//======================================criar funcionario=================================
export const createFuncionario = async (req: Request, res: Response) => {
  try {
    const escolinhaId = req.escolinhaId!;
    const data = createFuncionarioSchema.parse(req.body);

    const funcionario = await service.create(escolinhaId, data);

    res.status(201).json({
      success: true,
      message: 'Funcionário criado com sucesso',
      data: funcionario,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.issues,
      });
    }
    console.error('[CreateFuncionario] Erro:', error);
    res.status(500).json({ error: 'Erro ao criar funcionário' });
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
  try {
    const escolinhaId = req.escolinhaId!;
    const { id } = req.params;
    const data = updateFuncionarioSchema.parse(req.body);

    const funcionario = await service.update(escolinhaId, id, data);

    res.json({
      success: true,
      message: 'Funcionário atualizado com sucesso',
      data: funcionario,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.issues,
      });
    }
    console.error('[UpdateFuncionario] Erro:', error);
    res.status(500).json({ error: 'Erro ao atualizar funcionário' });
  }
};

//=======================================Redefinir senha===============================
export const redefinirSenhaFuncionario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const funcionario = await prisma.funcionario.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!funcionario || !funcionario.user) {
      return res.status(400).json({ success: false, error: 'Funcionário ou login não encontrado' });
    }

    const senhaTemporaria = Math.random().toString(36).slice(-12) + '!@#';

    const hashed = await bcrypt.hash(senhaTemporaria, 10);

    await prisma.user.update({
      where: { id: funcionario.user.id },
      data: { password: hashed },
    });

    res.json({
      success: true,
      message: 'Senha redefinida com sucesso',
      senhaTemporaria,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao redefinir senha' });
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