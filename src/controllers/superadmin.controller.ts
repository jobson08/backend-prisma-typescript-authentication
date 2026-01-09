// src/controllers/superadmin.controller.ts
import { Request, Response } from 'express';
import { createEscolinhaSchema } from '../dto/create-escolinha.dto';
import { EscolinhaService } from '../services/escolinha.service';
import { z } from 'zod';

const escolinhaService = new EscolinhaService();

// ======================== CRIAR ESCOLINHA ========================
export const criarEscolinha = async (req: Request, res: Response) => {
  try {
    const data = createEscolinhaSchema.parse(req.body);

    const escolinha = await escolinhaService.criarEscolinha(data);

    res.status(201).json({
      success: true,
      message: "Escolinha criada com sucesso!",
      data: {
        id: escolinha.id,
        nome: escolinha.nome,
        emailContato: escolinha.emailContato,
        planoSaaS: escolinha.planoSaaS,
        adminEmail: data.adminEmail,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Dados inválidos",
        details: error.issues.map(i => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    console.error('Erro ao criar escolinha:', error);
    res.status(500).json({ error: 'Erro interno ao criar escolinha' });
  }
};

// ======================== LISTAR TODAS ESCOLINHAS ========================
export const listarEscolinhas = async (req: Request, res: Response) => {
  try {
    const escolinhas = await escolinhaService.listarTodas();

    res.status(200).json({
      success: true,
      count: escolinhas.length,
      data: escolinhas.map(e => ({
        id: e.id,
        nome: e.nome,
        planoSaaS: e.planoSaaS,
        valorPlanoMensal: e.valorPlanoMensal,
        statusPagamentoSaaS: e.statusPagamentoSaaS,
        createdAt: e.createdAt,
        logoUrl: e.logoUrl,
        totalAlunos: e._count.alunosFutebol + e._count.alunosCrossfit,
      })),
    });
  } catch (error: any) {
    console.error('Erro ao listar escolinhas:', error);
    res.status(500).json({ error: 'Erro interno ao listar escolinhas' });
  }
};

// ======================== BUSCAR DETALHES DE UMA ESCOLINHA ========================
export const buscarEscolinha = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const escolinha = await escolinhaService.buscarPorId(id);

    res.status(200).json({
      success: true,
      data: {
        id: escolinha.id,
        nome: escolinha.nome,
        endereco: escolinha.endereco,
        logoUrl: escolinha.logoUrl,
        tipoDocumento: escolinha.tipoDocumento,
        documento: escolinha.documento,
        nomeResponsavel: escolinha.nomeResponsavel,
        emailContato: escolinha.emailContato,
        telefone: escolinha.telefone,
        planoSaaS: escolinha.planoSaaS,
        valorPlanoMensal: escolinha.valorPlanoMensal,
        statusPagamentoSaaS: escolinha.statusPagamentoSaaS,
        dataInicioPlano: escolinha.dataInicioPlano,
        dataProximoCobranca: escolinha.dataProximoCobranca,
        aulasExtrasAtivas: escolinha.aulasExtrasAtivas,
        crossfitAtivo: escolinha.crossfitAtivo,
        createdAt: escolinha.createdAt,
        updatedAt: escolinha.updatedAt,
        totalAlunos: escolinha._count.alunosFutebol + escolinha._count.alunosCrossfit,
      },
    });
  } catch (error: any) {
    if (error.message === "Escolinha não encontrada") {
      return res.status(404).json({ error: "Escolinha não encontrada" });
    }

    console.error('Erro ao buscar escolinha:', error);
    res.status(500).json({ error: 'Erro interno ao buscar escolinha' });
  }
};

// ======================== BATUALIZAR PLANO DE UMA ESCOLINHA ========================

export const atualizarPlano = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { planoSaaS, valorPlanoMensal } = req.body;

    if (!planoSaaS || typeof valorPlanoMensal !== "number") {
      return res.status(400).json({ error: "Plano SaaS e valor obrigatório" });
    }

    const atualizada = await escolinhaService.atualizarPlano(id, planoSaaS, valorPlanoMensal);

    res.status(200).json({
      success: true,
      message: "Plano atualizado com sucesso!",
      data: {
        id: atualizada.id,
        planoSaaS: atualizada.planoSaaS,
        valorPlanoMensal: atualizada.valorPlanoMensal,
        dataProximoCobranca: atualizada.dataProximoCobranca,
      },
    });
  } catch (error: any) {
    if (error.message.includes("não encontrada")) {
      return res.status(404).json({ error: "Escolinha não encontrada" });
    }
    console.error('Erro ao atualizar plano:', error);
    res.status(500).json({ error: 'Erro interno ao atualizar plano' });
  }
};

// ======================== SUSPENDER PAGAMENTO DE UMA ESCOLINHA ========================

export const suspenderPagamento = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const atualizada = await escolinhaService.suspenderPagamento(id);

    res.status(200).json({
      success: true,
      message: "Pagamento suspenso com sucesso!",
      data: {
        id: atualizada.id,
        statusPagamentoSaaS: atualizada.statusPagamentoSaaS,
      },
    });
  } catch (error: any) {
    if (error.message.includes("não encontrada")) {
      return res.status(404).json({ error: "Escolinha não encontrada" });
    }
    if (error.message.includes("já está suspenso")) {
      return res.status(400).json({ error: "Pagamento já está suspenso" });
    }
    console.error('Erro ao suspender pagamento:', error);
    res.status(500).json({ error: 'Erro interno ao suspender pagamento' });
  }
};