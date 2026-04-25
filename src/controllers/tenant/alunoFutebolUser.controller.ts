// src/controllers/tenant/alunoFutebol.controller.ts
import { Request, Response } from 'express';
import { AlunoFutebolService } from '../../services/tenant/alunoFutebolUser.service';
import { AppError } from '../../utils/AppError';

const service = new AlunoFutebolService();

export const getMeuPerfil = async (req: Request, res: Response) => {
  try {
    console.log("=== [CONTROLLER getMeuPerfil] INICIO ===");
    console.log("req.user completo:", JSON.stringify(req.user, null, 2));
    console.log("alunoFutebolId recebido:", req.user?.alunoFutebolId);
    console.log("escolinhaId recebido:", req.escolinhaId);

    const alunoId = req.user?.alunoFutebolId;

    if (!alunoId) {
      console.log("❌ ERRO: alunoFutebolId está undefined!");
      return res.status(403).json({
        error: "ID do aluno não encontrado no token",
        alunoFutebolId: req.user?.alunoFutebolId
      });
    }

    console.log("✅ Buscando aluno com ID:", alunoId, "na escolinha:", req.escolinhaId);

    const aluno = await service.getMeuPerfil(req.escolinhaId!, alunoId);

    console.log("✅ Perfil carregado com sucesso");

    return res.status(200).json({
      success: true,
      data: aluno,
    });
  } catch (error: any) {
    console.error("❌ Erro no Controller getMeuPerfil:", error);
    return res.status(error.status || 500).json({ 
      error: error.message || 'Erro interno ao buscar perfil',
      alunoFutebolId: req.user?.alunoFutebolId 
    });
  }
};

export const getProximosTreinos = async (req: Request, res: Response) => {
  try {
    const alunoId = req.user?.alunoFutebolId;

    if (!alunoId) {
      throw new AppError('ID do aluno não encontrado no token', 403);
    }

    const treinos = await service.getProximosTreinos(req.escolinhaId!, alunoId);

    return res.status(200).json({
      success: true,
      data: treinos,
    });
  } catch (error: any) {
    console.error('[getProximosTreinos] Erro:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
};

export const getEstatisticas = async (req: Request, res: Response) => {
  try {
    const alunoId = req.user?.alunoFutebolId;

    if (!alunoId) {
      throw new AppError('ID do aluno não encontrado no token', 403);
    }

    const estatisticas = await service.getEstatisticas(req.escolinhaId!, alunoId);

    return res.status(200).json({
      success: true,
      data: estatisticas,
    });
  } catch (error: any) {
    console.error('[getEstatisticas] Erro:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
};

export const trocarSenhaAluno = async (req: Request, res: Response) => {
  try {
    const alunoId = req.user?.alunoFutebolId;
    const { senhaAtual, novaSenha } = req.body;

    if (!alunoId) {
      throw new AppError('ID do aluno não encontrado no token', 403);
    }

    await service.trocarSenha(alunoId, senhaAtual, novaSenha);

    return res.status(200).json({
      success: true,
      message: 'Senha alterada com sucesso',
    });
  } catch (error: any) {
    console.error('[trocarSenhaAluno] Erro:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
};

export const getPresencas = async (req: Request, res: Response) => {
  try {
    const alunoId = req.user?.alunoFutebolId;

    if (!alunoId) {
      throw new AppError('ID do aluno não encontrado no token', 403);
    }

    const presencas = await service.getPresencasAluno(req.escolinhaId!, alunoId);

    return res.status(200).json({
      success: true,
      data: presencas,
    });
  } catch (error: any) {
    console.error('[getPresencas] Erro:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
};

export const getAvaliacoes = async (req: Request, res: Response) => {
  try {
    const alunoId = req.user?.alunoFutebolId;

    if (!alunoId) {
      throw new AppError('ID do aluno não encontrado no token', 403);
    }

    const avaliacoes = await service.getAvaliacoesAluno(req.escolinhaId!, alunoId);

    return res.status(200).json({
      success: true,
      data: avaliacoes,
    });
  } catch (error: any) {
    console.error('[getAvaliacoes] Erro:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
};