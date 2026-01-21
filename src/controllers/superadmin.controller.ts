// src/controllers/superadmin.controller.ts
import { Request, Response } from 'express';
import { createEscolinhaSchema } from '../dto/create-escolinha.dto';
import { EscolinhaService } from '../services/escolinha.service';
import { z } from 'zod';
import { prisma } from '../config/database';
import { Prisma } from '../../generated/prisma';

const escolinhaService = new EscolinhaService();

// ======================== CRIAR ESCOLINHA ========================
export const criarEscolinha = async (req: Request, res: Response) => {
  try {
    const data = createEscolinhaSchema.parse(req.body);

    // Normaliza emails para minúsculo (defesa contra maiúsculas/minúsculas misturadas)
    if (data.emailContato) {
      data.emailContato = data.emailContato.toLowerCase().trim();
    }
    if (data.adminEmail) {
      data.adminEmail = data.adminEmail.toLowerCase().trim();
    }

    console.log("[CriarEscolinha] Dados recebidos (emails normalizados):", data);

    const agora = new Date();
    const dataInicioPlano = data.dataInicioPlano ? new Date(data.dataInicioPlano) : agora;
    const dataProximoCobranca = new Date(dataInicioPlano);
    dataProximoCobranca.setDate(dataProximoCobranca.getDate() + 30);

    const escolinha = await escolinhaService.criarEscolinha({
      ...data,
      dataInicioPlano,
      dataProximoCobranca,
      statusPagamentoSaaS: data.statusPagamentoSaaS || "ativo",
      cidade: data.cidade,
      estado: data.estado,
      observacoes: data.observacoes,
    });

    res.status(201).json({
      success: true,
      message: "Escolinha criada com sucesso!",
      data: {
        id: escolinha.id,
        nome: escolinha.nome,
        cidade: escolinha.cidade,
        estado: escolinha.estado,
        observacoes: escolinha.observacoes,
        // ... outros campos
        dataInicioPlano: escolinha.dataInicioPlano?.toISOString(),
        dataProximoCobranca: escolinha.dataProximoCobranca?.toISOString(),
        statusPagamentoSaaS: escolinha.statusPagamentoSaaS,
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

    console.error('[CriarEscolinha] Erro completo:', error);
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
        cidade: e.cidade || "Não informado",
        estado: e.estado || "Não informado",
        planoSaaS: e.planoSaaS,
        valorPlanoMensal: e.valorPlanoMensal,
        statusPagamentoSaaS: e.statusPagamentoSaaS,
        dataInicioPlano: e.dataInicioPlano?.toISOString(),
        dataProximoCobranca: e.dataProximoCobranca?.toISOString(),
        createdAt: e.createdAt.toISOString(),
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
  const { id } = req.params;
  console.log("[Backend] Buscando escolinha ID:", id);

  try {
    const escolinha = await escolinhaService.buscarPorId(id);

    res.status(200).json({
      success: true,
      data: {
        id: escolinha.id,
        nome: escolinha.nome,
        endereco: escolinha.endereco,
        cidade: escolinha.cidade,
        estado: escolinha.estado,
        observacoes: escolinha.observacoes,
        logoUrl: escolinha.logoUrl,
        tipoDocumento: escolinha.tipoDocumento,
        documento: escolinha.documento,
        nomeResponsavel: escolinha.nomeResponsavel,
        emailContato: escolinha.emailContato,
        telefone: escolinha.telefone,
        planoSaaS: escolinha.planoSaaS,
        valorPlanoMensal: escolinha.valorPlanoMensal,
        statusPagamentoSaaS: escolinha.statusPagamentoSaaS,
        dataInicioPlano: escolinha.dataInicioPlano?.toISOString(),
        dataProximoCobranca: escolinha.dataProximoCobranca?.toISOString(),
        aulasExtrasAtivas: escolinha.aulasExtrasAtivas,
        crossfitAtivo: escolinha.crossfitAtivo,
        createdAt: escolinha.createdAt?.toISOString(),
        updatedAt: escolinha.updatedAt?.toISOString(),
        totalAlunos: (escolinha._count?.alunosFutebol || 0) + (escolinha._count?.alunosCrossfit || 0),
      },
    });
  } catch (error: any) {
    console.error("[Backend] Erro ao buscar:", error);
    if (error.message === "Escolinha não encontrada") {
      return res.status(404).json({ error: "Escolinha não encontrada" });
    }
    res.status(500).json({ error: 'Erro interno ao buscar escolinha' });
  }
};

// ======================== ATUALIZAR ESCOLINHA ========================
export const atualizarEscolinha = async (req: Request, res: Response) => {
  const { id } = req.params;

  console.log("[AtualizarEscolinha] ID:", id);
  console.log("[AtualizarEscolinha] Body:", req.body);

  try {
    if (!req.body.nome) {
      return res.status(400).json({ error: "Nome é obrigatório" });
    }

    const updateData: Prisma.EscolinhaUpdateInput = {
      nome: req.body.nome,
      endereco: req.body.endereco,
      telefone: req.body.telefone,
      emailContato: req.body.emailContato,
      nomeResponsavel: req.body.nomeResponsavel,
      planoSaaS: req.body.planoSaaS,
      valorPlanoMensal: req.body.valorPlanoMensal,
      statusPagamentoSaaS: req.body.statusPagamentoSaaS,
      dataProximoCobranca: req.body.dataProximoCobranca ? new Date(req.body.dataProximoCobranca) : undefined,
      aulasExtrasAtivas: req.body.aulasExtrasAtivas,
      crossfitAtivo: req.body.crossfitAtivo,
      cidade: req.body.cidade,
      estado: req.body.estado,
      observacoes: req.body.observacoes,
    };

    // Validações extras
    if (updateData.planoSaaS && !["basico", "pro", "enterprise"].includes(updateData.planoSaaS as string)) {
      return res.status(400).json({ error: "Plano inválido" });
    }

    const atualizada = await escolinhaService.atualizarEscolinha(id, updateData);

    res.status(200).json({
      success: true,
      message: "Escolinha atualizada!",
      data: atualizada,
    });
  } catch (error: any) {
    console.error("[AtualizarEscolinha] Erro:", error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Escolinha não encontrada" });
    }
    res.status(500).json({ error: 'Erro interno ao atualizar' });
  }
};

// ======================== LISTAR PAGAMENTOS ========================
export const listarPagamentos = async (req: Request, res: Response) => {
  try {
    const pagamentos = await prisma.pagamento.findMany({
      include: {
        escolinha: {
          select: { nome: true, planoSaaS: true },
        },
      },
      orderBy: { dataPagamento: 'desc' },
    });

    const formatted = pagamentos.map(p => ({
      id: p.id,
      escolinha: p.escolinha.nome,
      plano: p.escolinha.planoSaaS,
      valor: p.valor,
      dataPagamento: p.dataPagamento?.toISOString() || null,
      dataVencimento: p.dataVencimento?.toISOString() || null, // se existir no schema
      status: p.status,
      metodo: p.metodo || "Não informado",
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error: any) {
    console.error("[ListarPagamentos] Erro:", error);
    res.status(500).json({ error: "Erro ao listar pagamentos" });
  }
};

// ======================== ATUALIZAR PLANO ========================
export const atualizarPlano = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { planoSaaS, valorPlanoMensal } = req.body;

  try {
    if (!planoSaaS || typeof valorPlanoMensal !== "number") {
      return res.status(400).json({ error: "Plano e valor obrigatórios" });
    }

    const atualizada = await escolinhaService.atualizarPlano(id, planoSaaS, valorPlanoMensal);

    res.status(200).json({
      success: true,
      message: "Plano atualizado!",
      data: atualizada,
    });
  } catch (error: any) {
    console.error("[AtualizarPlano] Erro:", error);
    res.status(500).json({ error: 'Erro ao atualizar plano' });
  }
};

// ======================== SUSPENDER PAGAMENTO ========================
export const suspenderPagamento = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const atualizada = await escolinhaService.suspenderPagamento(id);

    res.status(200).json({
      success: true,
      message: "Pagamento suspenso!",
      data: atualizada,
    });
  } catch (error: any) {
    console.error("[SuspenderPagamento] Erro:", error);
    res.status(500).json({ error: 'Erro ao suspender pagamento' });
  }
};

// ======================== DASHBOARD ========================
export const dashboard = async (req: Request, res: Response) => {
  try {
    const totalEscolinhas = await prisma.escolinha.count();
    const escolinhasAtivas = await prisma.escolinha.count({
      where: { statusPagamentoSaaS: "ativo" },
    });
    const totalAlunos = await prisma.alunoFutebol.count() + await prisma.clienteCrossfit.count();

    const atividadeRecente = await prisma.escolinha.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        nome: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        totalEscolinhas,
        escolinhasAtivas,
        totalAlunos,
        receitaMensal: 185420, // TODO: calcular real
        receitaAnual: 2225040, // TODO: calcular real
        crescimentoMensal: "+18.4%",
        ticketMedio: "R$ 271",
        ultimaAtualizacao: new Date().toLocaleString("pt-BR"),
        atividadeRecente: atividadeRecente.map(e => ({
          nome: e.nome,
          acao: "Novo cadastro",
          data: new Date(e.createdAt).toLocaleString("pt-BR"),
        })),
      },
    });
  } catch (error) {
    console.error('Erro no dashboard:', error);
    res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
};