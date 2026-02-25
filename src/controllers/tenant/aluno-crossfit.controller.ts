// src/controllers/tenant/aluno-crossfit.controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database';
import bcrypt from 'bcrypt';
import { AlunoCrossfitService } from '../../services/tenant/aluno-crossfit.service';
import { createAlunoCrossfitSchema, updateAlunoCrossfitSchema } from '../../dto/tenant/aluno-crossfit.dto';

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
  console.log('[CONTROLLER CREATE ALUNO CROSSFIT] Iniciando criação');
  console.log('[CONTROLLER CREATE ALUNO CROSSFIT] Body recebido:', JSON.stringify(req.body, null, 2));

  try {
    const escolinhaId = req.escolinhaId!;
    const data = createAlunoCrossfitSchema.parse(req.body);

    console.log('[CONTROLLER CREATE ALUNO CROSSFIT] Dados validados:', JSON.stringify(data, null, 2));

    const result = await service.create(escolinhaId, data);

    console.log('[CONTROLLER CREATE ALUNO CROSSFIT] Resultado:', JSON.stringify(result, null, 2));

    res.status(201).json({
      success: true,
      message: 'Aluno Crossfit criado com sucesso',
      data: result.aluno,
      senhaTemporaria: result.senhaTemporaria,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      console.error('[CREATE ALUNO CROSSFIT] Erro Zod:', error.issues);
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })),
      });
    }

    const message = error instanceof Error ? error.message : 'Erro interno ao criar aluno crossfit';
    console.error('[CREATE ALUNO CROSSFIT] Erro:', message, error);
    res.status(500).json({ error: message });
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

  console.log('[CONTROLLER UPDATE ALUNO CROSSFIT] Iniciando atualização');
  console.log('[CONTROLLER UPDATE ALUNO CROSSFIT] ID do aluno:', req.params.id);
  console.log('[CONTROLLER UPDATE ALUNO CROSSFIT] Body recebido:', JSON.stringify(req.body, null, 2));

    const data = updateAlunoCrossfitSchema.parse(req.body);

    console.log('[CONTROLLER UPDATE ALUNO CROSSFIT] Dados validados pelo Zod:', JSON.stringify(data, null, 2));

    const alunoAtualizado = await service.update(escolinhaId, id, data);

    console.log('[CONTROLLER UPDATE ALUNO CROSSFIT] Aluno atualizado com sucesso - ID:', id);

    res.json({
      success: true,
      message: 'Aluno Crossfit atualizado com sucesso',
      data: alunoAtualizado,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      console.error('[UPDATE ALUNO CROSSFIT] Erro Zod:', error.issues);
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })),
      });
    }

    const message = error instanceof Error ? error.message : 'Erro interno ao atualizar aluno Crossfit';
    console.error('[UPDATE ALUNO CROSSFIT] Erro completo:', message, error);
    res.status(500).json({ error: message });
  }
};

//Redefinir senha
// src/controllers/tenant/aluno.controller.ts
export const redefinirSenhaAlunoCrossfit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log('[REDEFINIR SENHA ALUNO] Buscando aluno ID:', id);

const aluno = await prisma.alunoCrossfit.findUnique({
  where: { id },
  include: { user: true },  // não pode faltar nem estar comentado
});

if (!aluno) {
  return res.status(404).json({ success: false, error: 'Aluno não encontrado' });
}

console.log('[REDEFINIR SENHA ALUNO] userId encontrado:', aluno.userId);
console.log('[REDEFINIR SENHA ALUNO] User encontrado no include:', aluno.user ? 'SIM' : 'NÃO');

if (!aluno.user) {
  return res.status(400).json({
    success: false,
    error: 'Este aluno não possui login associado',
  });
}
if (!aluno.userId) {
  return res.status(400).json({ error: 'Aluno sem ID de usuário vinculado' });
}

    const senhaTemporaria = Math.random().toString(36).slice(-12) + '!@#';
    const hashed = await bcrypt.hash(senhaTemporaria, 10);

    await prisma.user.update({
      where: { id: aluno.user.id },
      data: { password: hashed },
    });

    console.log('[REDEFINIR SENHA ALUNO] Senha atualizada com sucesso para user ID:', aluno.user.id);

    return res.json({
      success: true,
      message: 'Senha redefinida com sucesso',
      senhaTemporaria,
    });
  } catch (err: any) {
    console.error('[REDEFINIR SENHA ALUNO CROSSFIT] Erro completo:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro ao redefinir senha',
    });
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