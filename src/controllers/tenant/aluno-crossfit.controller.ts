// src/controllers/tenant/aluno-crossfit.controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { AlunoCrossfitService } from '../../services/tenant/aluno-crossfit.service';
import { CreateAlunoCrossfitDTO, UpdateAlunoCrossfitDTO } from '../../dto/tenant/aluno-crossfit.dto';

const service = new AlunoCrossfitService();

// Função auxiliar para gerar senha aleatória (igual ao de futebol)
function gerarSenhaAleatoria(tamanho = 10) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$";
  let senha = "";
  for (let i = 0; i < tamanho; i++) {
    senha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return senha;
}

export const createAlunoCrossfit = async (req: Request, res: Response) => {
 // console.log("Body recebido:", req.body);
  try {
    const escolinhaId = req.escolinhaId!; // vem do middleware de autenticação
    const body = CreateAlunoCrossfitDTO.parse(req.body);

    const result = await service.create(escolinhaId, body);

    res.status(201).json({
      success: true,
      message: "Aluno de CrossFit criado com sucesso",
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

   // console.error("[CREATE ALUNO CROSSFIT] Erro:", error);
    res.status(500).json({ error: "Erro interno ao criar aluno de CrossFit" });
  }
};

export const listAlunosCrossfit = async (req: Request, res: Response) => {
  try {
    const escolinhaId = req.escolinhaId!;
    const alunos = await service.list(escolinhaId);
    res.json({ success: true, data: alunos });
  } catch (error) {
  //  console.error("[LIST ALUNOS CROSSFIT] Erro:", error);
    res.status(500).json({ error: "Erro ao listar alunos de CrossFit" });
  }
};

export const getAlunoCrossfitById = async (req: Request, res: Response) => {
  try {
    const escolinhaId = req.escolinhaId!;
    const { id } = req.params;

    const aluno = await service.getById(escolinhaId, id);
    res.json({ success: true, data: aluno });
  } catch (error: any) {
    //console.error("[GET ALUNO CROSSFIT] Erro:", error);
    res.status(404).json({ error: error.message || "Aluno de CrossFit não encontrado" });
  }
};

export const updateAlunoCrossfit = async (req: Request, res: Response) => {
  try {
    const escolinhaId = req.escolinhaId!;
    const { id } = req.params;
    const body = UpdateAlunoCrossfitDTO.parse(req.body);

    const updated = await service.update(escolinhaId, id, body);
    res.json({ 
      success: true, 
      message: "Aluno de CrossFit atualizado com sucesso", 
      data: updated 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Dados inválidos",
        details: error.issues,
      });
    }

  //  console.error("[UPDATE ALUNO CROSSFIT] Erro:", error);
    res.status(500).json({ error: "Erro ao atualizar aluno de CrossFit" });
  }
};

export const deleteAlunoCrossfit = async (req: Request, res: Response) => {
  try {
    const escolinhaId = req.escolinhaId!;
    const { id } = req.params;

    await service.delete(escolinhaId, id);
    res.json({ success: true, message: "Aluno de CrossFit deletado com sucesso" });
  } catch (error: any) {
  //  console.error("[DELETE ALUNO CROSSFIT] Erro:", error);
    res.status(404).json({ error: error.message || "Aluno de CrossFit não encontrado" });
  }
};