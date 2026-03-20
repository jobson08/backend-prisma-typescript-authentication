// src/controllers/tenant/aluno-crossfit.controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database';
import bcrypt from 'bcrypt';
import { AlunoCrossfitService } from '../../services/tenant/aluno-crossfit.service';
import { createAlunoCrossfitSchema, crossfitInscricaoSchema, crossfitTurmaSchema, updateAlunoCrossfitSchema, updateCrossfitInscricaoSchema } from '../../dto/tenant/aluno-crossfit.dto';

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

//ativar e desativar Crossfit na pagina configuração
export const toggleCrossfitActivation = async (req: Request, res: Response) => {
  try {
    const { ativarCrossfit } = req.body;

    if (typeof ativarCrossfit !== 'boolean') {
      return res.status(400).json({ error: "O campo 'ativarCrossfit' deve ser boolean" });
    }

    await prisma.escolinha.update({
      where: { id: req.escolinhaId! },
      data: { crossfitAtivo: ativarCrossfit },
    });

    return res.json({ success: true, message: `CrossFit ${ativarCrossfit ? 'ativado' : 'desativado'}` });
  } catch (err: any) {
    console.error('[TOGGLE CROSSFIT ERROR]', err);
    return res.status(500).json({ error: 'Erro ao atualizar ativação do CrossFit' });
  }
}



//=======================Controller criação de turmas e relacionamento com o aluno crossfit==============
//cria turmas crossfit
export const criarTurma = async (req: Request, res: Response) => {
  try {
    const data = crossfitTurmaSchema.parse(req.body);

    console.log('[CONTROLLER] Payload recebido para criar turma CrossFit:', {
      ...data,
      escolinhaId: req.escolinhaId,
    });

    const turma = await service.criarTurma(req.escolinhaId!, data);

    return res.status(201).json({ success: true, message: 'Turma criada', data: turma });
  } catch (err: any) {
    console.error('[CREATE CROSSFIT TURMA ERROR] Erro completo:', {
      message: err.message,
      stack: err.stack,
      payload: req.body,
      escolinhaId: req.escolinhaId,
    });

    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: err.issues });
    }

    if (err.code === 'P2003') { // Prisma foreign key constraint failed
      return res.status(400).json({ error: 'Professor não encontrado ou inválido' });
    }

    return res.status(500).json({ error: 'Erro interno ao criar turma CrossFit' });
  }
};

  //atualisar turmas crossfit
export const atualizarTurma = async (req: Request, res: Response) =>{
  try {
      const { id } = req.params;
      const data = crossfitTurmaSchema.partial().parse(req.body);
      const turma = await service.atualizarTurma(id, req.escolinhaId!, data);
      return res.json({ success: true, message: 'Turma atualizada', data: turma });
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: 'Dados inválidos', details: err.issues });
      return res.status(500).json({ error: 'Erro ao atualizar turma' });
    }
  }

  //listar turmas
  export const listarTurmas = async (req: Request, res: Response) =>{
    try {
      const turmas = await service.listarTurmas(req.escolinhaId!);
      return res.json({ success: true, data: turmas });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao listar turmas' });
    }
  }

  //Excluir turmas
  export const excluirTurma = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await service.excluirTurma(id, req.escolinhaId!);
    return res.json({ success: true, message: 'Turma excluída com sucesso' });
  } catch (err: any) {
    console.error('[EXCLUIR TURMA CROSSFIT ERROR]', err);
    if (err.message.includes("não encontrada") || err.message.includes("inscritos")) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Erro ao excluir turma' });
  }
}

  // Cadastrar alunos a turmas

  export const inscreverAluno = async (req: Request, res: Response) =>{
   try {
    const data = crossfitInscricaoSchema.parse(req.body);
    const inscricao = await service.inscreverAluno(data);
    return res.status(201).json({ success: true, message: 'Aluno inscrito', data: inscricao });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: err.issues });
    }
    if (err.message.includes("já está inscrito") || err.message.includes("lotada")) {
      return res.status(409).json({ error: err.message });
    }
    console.error('[INScrever ALUNO CROSSFIT ERROR]', err);
    return res.status(500).json({ error: 'Erro ao inscrever aluno' });
   }
  }

  //Atualizar Incrição
  export const atualizarInscricao =  async (req: Request, res: Response) =>{
    try {
      const { id } = req.params;
      const data = updateCrossfitInscricaoSchema.parse(req.body);
      const inscricao = await service.atualizarInscricao(id, data);
      return res.json({ success: true, message: 'Inscrição atualizada', data: inscricao });
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: 'Dados inválidos', details: err.issues });
      return res.status(500).json({ error: 'Erro ao atualizar inscrição' });
    }
  }

  //Excluir Incrisção
  export const excluirInscricao = async (req: Request, res: Response) =>{
    try {
      const { id } = req.params;
      await service.excluirInscricao(id);
      return res.json({ success: true, message: 'Inscrição excluída' });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao excluir inscrição' });
    }
  }

    //Listar Incrições
  export const listarInscricoes = async (req: Request, res: Response) =>{
    try {
      const { turmaId } = req.params;
      const inscricoes = await service.listarInscricoes(turmaId);
      return res.json({ success: true, data: inscricoes });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao listar inscrições' });
    }
  }

