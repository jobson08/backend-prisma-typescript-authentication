// src/controllers/superadmin.controller.ts
import { Request, Response } from 'express';
import { createEscolinhaSchema } from '../dto/create-escolinha.dto';
import { EscolinhaService } from '../services/escolinha.service';
import { z } from 'zod';
import { prisma } from '../config/database';

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
  const { id } = req.params;
  console.log("[Backend] Buscando escolinha com ID:", id);

  try {
    const escolinha = await escolinhaService.buscarPorId(id);
    console.log("[Backend] Escolinha encontrada:", escolinha);

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
    console.error("[Backend] Erro ao buscar escolinha ID:", id, error.message);
    if (error.message === "Escolinha não encontrada") {
      return res.status(404).json({ error: "Escolinha não encontrada" });
    }
    res.status(500).json({ error: 'Erro interno ao buscar escolinha' });
  }
};

// ======================== ATUALIZAR ESCOLINHA ========================
export const atualizarEscolinha = async (req: Request, res: Response) => {
  const { id } = req.params;

  console.log("[AtualizarEscolinha] Iniciando atualização - ID:", id);
  console.log("[AtualizarEscolinha] Body recebido:", req.body);

  try {
    // 1. Validação básica obrigatória (campos essenciais)
    if (!req.body.nome) {
      return res.status(400).json({ 
        success: false,
        error: "O campo 'nome' é obrigatório" 
      });
    }

    // 2. Campos permitidos para atualização (evita atualização de campos sensíveis)
    const allowedFields = [
      "nome",
      "endereco",
      "telefone",
      "emailContato",
      "nomeResponsavel",
      "planoSaaS",
      "valorPlanoMensal",
      "statusPagamentoSaaS",
      "dataProximoCobranca",
      "aulasExtrasAtivas",
      "crossfitAtivo",
      "observacoes",          // se você adicionar no schema
      // "logoUrl" - será tratado separadamente com upload
    ];

    // Filtra apenas os campos permitidos que vieram no body
    const updateData: any = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    // 3. Validação extra para campos específicos (opcional, mas recomendado)
    if (updateData.planoSaaS && !["basico", "pro", "enterprise"].includes(updateData.planoSaaS)) {
      return res.status(400).json({ 
        success: false,
        error: "Plano SaaS inválido. Valores permitidos: basico, pro, enterprise" 
      });
    }

    if (updateData.valorPlanoMensal !== undefined && typeof updateData.valorPlanoMensal !== "number") {
      return res.status(400).json({ 
        success: false,
        error: "valorPlanoMensal deve ser um número" 
      });
    }

    // 4. Atualiza no banco via service
    const atualizada = await escolinhaService.atualizarEscolinha(id, updateData);

    console.log("[AtualizarEscolinha] Escolinha atualizada com sucesso:", atualizada.id);

    // 5. Resposta de sucesso
    res.status(200).json({
      success: true,
      message: "Escolinha atualizada com sucesso!",
      data: {
        id: atualizada.id,
        nome: atualizada.nome,
        endereco: atualizada.endereco,
        telefone: atualizada.telefone,
        emailContato: atualizada.emailContato,
        nomeResponsavel: atualizada.nomeResponsavel,
        planoSaaS: atualizada.planoSaaS,
        valorPlanoMensal: atualizada.valorPlanoMensal,
        statusPagamentoSaaS: atualizada.statusPagamentoSaaS,
        dataProximoCobranca: atualizada.dataProximoCobranca,
        aulasExtrasAtivas: atualizada.aulasExtrasAtivas,
        crossfitAtivo: atualizada.crossfitAtivo,
        updatedAt: atualizada.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("[AtualizarEscolinha] Erro completo:", error);

    if (error.message?.includes("não encontrada") || error.code === "P2025") {
      return res.status(404).json({ 
        success: false,
        error: "Escolinha não encontrada" 
      });
    }

    // Erro genérico
    res.status(500).json({ 
      success: false,
      error: "Erro interno ao atualizar escolinha",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

//=========================LISTAR PAGAMENTO=========================================
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
      dataVencimento: p.dataVencimento?.toISOString() || null,
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

// ======================== ATUALIZAR PLANO DE UMA ESCOLINHA ========================

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
// ======================== CALCULAR RECEITA DE UMA ESCOLINHA ========================
export const dashboard = async (req: Request, res: Response) => {
  try {
    const totalEscolinhas = await prisma.escolinha.count();
    const escolinhasAtivas = await prisma.escolinha.count({
      where: { statusPagamentoSaaS: "ativo" },
    });
    const totalAlunos = await prisma.alunoFutebol.count() + await prisma.clienteCrossfit.count();

    // ... calcule receitaMensal, etc com base em mensalidades e planos

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
        receitaMensal: 185420, // calcule real
        receitaAnual: 2225040,
        crescimentoMensal: "+18.4%",
        ticketMedio: "R$ 271",
        taxaConversaoTeste: "78%",
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