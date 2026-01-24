import { Request, Response } from 'express';
import { z } from 'zod';
import { createAlunoFutebolSchema, updateAlunoFutebolSchema } from '../../dto/tenant/aluno-futebol.dto';
import { AlunoFutebolService } from '../../services/tenant/aluno-futebol.service';


const service = new AlunoFutebolService();

// Função auxiliar para gerar senha aleatória
function gerarSenhaAleatoria(tamanho = 10) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$";
  let senha = "";
  for (let i = 0; i < tamanho; i++) {
    senha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return senha;
}

export const createAluno = async (req: Request, res: Response) => {
  console.log("Body recebido:", req.body);
  try {
    const escolinhaId = req.escolinhaId!; // vem do middleware de autenticação
    const body = createAlunoFutebolSchema.parse(req.body);

    const result = await service.create(escolinhaId, body);

    res.status(201).json({
      success: true,
      message: "Aluno criado com sucesso",
      data: result,
      senhaTemporaria: result.senhaTemporaria,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Dados inválidos",
        details: error.issues,
      });
    }

    console.error(error);
    res.status(500).json({ error: "Erro interno ao criar aluno" });
  }
};

export const listAlunos = async (req: Request, res: Response) => {
  try {
    const escolinhaId = req.escolinhaId!;
    const alunos = await service.list(escolinhaId);
    res.json({ success: true, data: alunos });
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar alunos" });
  }
};

export const getAlunoById = async (req: Request, res: Response) => {
  try {
    const escolinhaId = req.escolinhaId!;
    const { id } = req.params;

    const aluno = await service.getById(escolinhaId, id);
    res.json({ success: true, data: aluno });
  } catch (error: any) {
    res.status(404).json({ error: error.message || "Aluno não encontrado" });
  }
};

export const updateAluno = async (req: Request, res: Response) => {
  try {
    const escolinhaId = req.escolinhaId!;
    const { id } = req.params;
    const body = updateAlunoFutebolSchema.parse(req.body);

    const updated = await service.update(escolinhaId, id, body);
    res.json({ success: true, message: "Aluno atualizado com sucesso", data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Dados inválidos",
        details: error.issues,
      });
    }

    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar aluno" });
  }
};

export const deleteAluno = async (req: Request, res: Response) => {
  try {
    const escolinhaId = req.escolinhaId!;
    const { id } = req.params;

    await service.delete(escolinhaId, id);
    res.json({ success: true, message: "Aluno deletado com sucesso" });
  } catch (error: any) {
    res.status(404).json({ error: error.message || "Aluno não encontrado" });
  }
};