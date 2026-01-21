import { Request, Response } from 'express';
import { FuncionarioService } from '../../services/funcionario.service';
import { createFuncionarioSchema, updateFuncionarioSchema } from '../../dto/tenant/funcionario.dto';
import { z } from 'zod';
import { prisma } from '../../server';
import bcrypt from 'bcrypt';

const service = new FuncionarioService();
//======================================criar funcionario=================================
export const createFuncionario = async (req: Request, res: Response) => {
  try {
    const escolinhaId = req.escolinhaId!;
    const data = createFuncionarioSchema.parse(req.body);

    // Normaliza o email para minúsculo (evita duplicidade)
    data.email = data.email.toLowerCase();

    // Verifica se já existe (agora com email minúsculo)
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "E-mail já cadastrado" });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email, // já está em minúsculo
        password: hashedPassword,
        name: data.nome,
        role: 'FUNCIONARIO',
        escolinhaId,
      },
    });

    // Cria o Funcionário vinculado
    const funcionario = await prisma.funcionario.create({
      data: {
        nome: data.nome,
        cargo: data.cargo,
        salario: data.salario,
        telefone: data.telefone,
        email: data.email,
        observacoes: data.observacoes,
        escolinhaId,
        userId: user.id, // vincula o login
      },
    });

    res.status(201).json({
      success: true,
      message: 'Funcionário e login criados com sucesso',
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
    res.status(500).json({ error: 'Erro interno ao criar funcionário' });
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