// src/controllers/superadmin.controller.ts
import { Request, Response } from 'express';
import { createEscolinhaSchema } from '../../dto/create-escolinha.dto';
import { EscolinhaService } from '../../services/superadmin/escolinha.service';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { Prisma } from '../../../generated/prisma';


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
     // dataInicioPlano,
     // dataProximoCobranca,
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
    const { mes, page = '1', limit = '10', status, tipo } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const take = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * take;

    // Filtro por mês (padrão: mês atual se não informado)
    let where: any = {};
    let mesFiltro = mes as string | undefined;

    if (!mesFiltro || mesFiltro === 'todos') {
      // Mês atual como fallback
      const hoje = new Date();
      const inicio = startOfMonth(hoje);
      const fim = endOfMonth(hoje);
      where.dataVencimento = { gte: inicio, lt: fim };
    } else if (/^\d{4}-\d{2}$/.test(mesFiltro)) {
      const [ano, mesNum] = mesFiltro.split('-').map(Number);
      const inicio = startOfMonth(new Date(ano, mesNum - 1, 1));
      const fim = endOfMonth(new Date(ano, mesNum - 1, 1));
      where.dataVencimento = { gte: inicio, lt: fim };
    }

    // Filtros adicionais
    if (status && typeof status === 'string') {
      where.status = status.toUpperCase();
    }
    if (tipo && typeof tipo === 'string') {
      where.tipo = tipo;
    }

    const [pagamentos, total] = await Promise.all([
      prisma.pagamento.findMany({
        where,
        include: {
          escolinha: { select: { nome: true, planoSaaS: true } },
        },
        orderBy: { dataVencimento: 'desc' },
        skip,
        take,
      }),
      prisma.pagamento.count({ where }),
    ]);

    const formatted = pagamentos.map(p => ({
      id: p.id,
      escolinha: p.escolinha?.nome || "Escolinha não encontrada",
      plano: p.escolinha?.planoSaaS || "Desconhecido",
      valor: p.valor,
      dataPagamento: p.dataPagamento ? format(p.dataPagamento, 'dd/MM/yyyy HH:mm', { locale: ptBR }) : null,
      dataVencimento: p.dataVencimento ? format(p.dataVencimento, 'dd/MM/yyyy', { locale: ptBR }) : null,
      status: p.status,
      metodo: p.metodo || "Não informado",
    }));

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / take),
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
    if (!planoSaaS || !['basico', 'pro', 'enterprise'].includes(planoSaaS)) {
      return res.status(400).json({ error: "Plano inválido (basico, pro, enterprise)" });
    }

    if (typeof valorPlanoMensal !== "number" || valorPlanoMensal <= 0) {
      return res.status(400).json({ error: "Valor do plano deve ser maior que zero" });
    }

    const atualizada = await escolinhaService.atualizarPlano(id, planoSaaS, valorPlanoMensal);

    res.status(200).json({
      success: true,
      message: "Plano atualizado com sucesso",
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
  const { motivo } = req.body;

  try {
    const escolinha = await prisma.escolinha.findUnique({ where: { id } });
    if (!escolinha) {
      return res.status(404).json({ error: "Escolinha não encontrada" });
    }

    if (escolinha.statusPagamentoSaaS === 'suspenso') {
      return res.status(400).json({ error: "Escolinha já está suspensa" });
    }

    const atualizada = await escolinhaService.suspenderPagamento(id, motivo || 'Suspensão manual por superAdmin');

    res.status(200).json({
      success: true,
      message: "Pagamento suspenso com sucesso",
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
    const { mes } = req.query; // ?mes=YYYY-MM ou omitido (usa mês atual)

    // Define intervalo de data (mês atual ou selecionado)
    let inicioMes: Date;
    let fimMes: Date;

    if (mes && typeof mes === 'string' && /^\d{4}-\d{2}$/.test(mes)) {
      const [ano, mesNum] = mes.split('-').map(Number);
      inicioMes = startOfMonth(new Date(ano, mesNum - 1, 1));
      fimMes = endOfMonth(new Date(ano, mesNum - 1, 1));
    } else {
      // Mês atual como padrão
      const hoje = new Date();
      inicioMes = startOfMonth(hoje);
      fimMes = endOfMonth(hoje);
    }

    // Totais gerais (não dependem do mês)
    const totalEscolinhas = await prisma.escolinha.count();
    const escolinhasAtivas = await prisma.escolinha.count({
      where: { statusPagamentoSaaS: "ativo" },
    });
    const totalAlunos = 
      (await prisma.alunoFutebol.count()) + 
      (await prisma.alunoCrossfit.count());

    // Atividade recente (últimos 5 cadastros ou ações)
    const atividadeRecente = await prisma.escolinha.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        nome: true,
        createdAt: true,
      },
    });

    // Receita mensal real (somente SaaS do mês selecionado)
    const receitaMensalResult = await prisma.pagamento.aggregate({
      where: {
        tipo: 'saas',
        dataVencimento: { gte: inicioMes, lt: fimMes },
        status: { in: ['CONFIRMADO'] }, // ajuste conforme seu enum
      },
      _sum: { valor: true },
    });
    const receitaMensal = receitaMensalResult._sum.valor || 0;

    // Receita anual projetada (estimativa simples: 12 × mensal)
    const receitaAnual = receitaMensal * 12;

    // Crescimento mensal (comparação com mês anterior - opcional)
    const mesAnteriorInicio = startOfMonth(subMonths(inicioMes, 1));
    const mesAnteriorFim = endOfMonth(subMonths(inicioMes, 1));

    const receitaMesAnteriorResult = await prisma.pagamento.aggregate({
      where: {
        tipo: 'saas',
        dataVencimento: { gte: mesAnteriorInicio, lt: mesAnteriorFim },
        status: { in: ['CONFIRMADO'] },
      },
      _sum: { valor: true },
    });
    const receitaMesAnterior = receitaMesAnteriorResult._sum.valor || 0;

    const crescimentoMensal = receitaMesAnterior === 0
      ? "+∞%"
      : ((receitaMensal - receitaMesAnterior) / receitaMesAnterior * 100).toFixed(1) + '%';

    // Ticket médio (receita mensal / número de escolinhas pagantes)
    const ticketMedio = escolinhasAtivas > 0
      ? (receitaMensal / escolinhasAtivas).toFixed(2)
      : "0.00";

    res.status(200).json({
      success: true,
      data: {
        totalEscolinhas,
        escolinhasAtivas,
        totalAlunos,
        receitaMensal,
        receitaAnual,
        crescimentoMensal,
        ticketMedio: `R$ ${ticketMedio}`,
        ultimaAtualizacao: format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR }),
        atividadeRecente: atividadeRecente.map(e => ({
          nome: e.nome,
          acao: "Novo cadastro",
          data: format(e.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR }),
        })),
      },
    });
  } catch (error: any) {
    console.error('[SUPERADMIN DASHBOARD] Erro:', error);
    res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
};