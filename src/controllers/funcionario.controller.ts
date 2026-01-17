import { Request, Response } from 'express';
import { FuncionarioService } from '../services/funcionario.service';
import { createFuncionarioSchema } from '../dto/funcionario.dto';
import { z } from 'zod';

const service = new FuncionarioService();

export const createFuncionario = async (req: Request, res: Response) => {
  try {
    const escolinhaId = req.escolinhaId; // vindo do tenantGuard

    if (!escolinhaId) {
      return res.status(403).json({ error: 'Escolinha não identificada' });
    }

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
    res.status(500).json({ error: 'Erro interno ao criar funcionário' });
  }
};