import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database';
import bcrypt from 'bcrypt';
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
  try {
    const escolinhaId = req.escolinhaId!;
    const fotoFile = req.file; // arquivo enviado pelo multer

    console.log('[CONTROLLER CREATE ALUNO] Foto recebida:', fotoFile ? fotoFile.originalname : 'Nenhuma');

    // Validação dos dados (mantemos o schema, mas agora pegamos do req.body)
    const data = createAlunoFutebolSchema.parse({
      ...req.body,
      // Se quiser permitir fotoUrl vir do body, pode adicionar aqui
    });

    const result = await service.create(escolinhaId, data, fotoFile);

    res.status(201).json({
      success: true,
      message: 'Aluno criado com sucesso',
      data: result.aluno,
      senhaTemporaria: result.senhaTemporaria,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.issues,
      });
    }

    console.error('[CREATE ALUNO] Erro:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno ao criar aluno' 
    });
  }
};
//LISTAR ALUNOS
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

    console.log('[CONTROLLER UPDATE ALUNO FUTEBOL] Iniciando atualização - ID:', id);
    console.log('[CONTROLLER UPDATE ALUNO FUTEBOL] Body recebido:', JSON.stringify(req.body, null, 2));

    const data = updateAlunoFutebolSchema.parse(req.body);

    const alunoAtualizado = await service.update(escolinhaId, id, data);

    res.json({
      success: true,
      message: 'Aluno atualizado com sucesso',
      data: alunoAtualizado,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      console.error('[UPDATE ALUNO FUTEBOL] Erro Zod:', error.issues);
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })),
      });
    }

    const message = error instanceof Error ? error.message : 'Erro interno ao atualizar aluno';
    console.error('[UPDATE ALUNO FUTEBOL] Erro:', message, error);
    res.status(500).json({ error: message });
  }
};

//Redefinir senha
// src/controllers/tenant/aluno.controller.ts
export const redefinirSenhaAluno = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log('[REDEFINIR SENHA ALUNO] Buscando aluno ID:', id);

const aluno = await prisma.alunoFutebol.findUnique({
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
    console.error('[REDEFINIR SENHA ALUNO] Erro completo:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro ao redefinir senha',
    });
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