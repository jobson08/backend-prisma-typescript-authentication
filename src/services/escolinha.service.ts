// src/services/escolinha.service.ts
import { prisma } from '../config/database';
import bcrypt from 'bcrypt';
import { CreateEscolinhaDto } from '../dto/create-escolinha.dto';


export class EscolinhaService {
  async criarEscolinha(data: CreateEscolinhaDto) {
    const hashedPassword = await bcrypt.hash(data.adminPassword, 12);

    return await prisma.$transaction(async (tx) => {
      // 1. Cria a escolinha
      const escolinha = await tx.escolinha.create({
        data: {
          nome: data.nome,
          endereco: data.endereco,
          tipoDocumento: data.tipoDocumento,
          documento: data.documento,
          nomeResponsavel: data.nomeResponsavel,
          emailContato: data.emailContato,
          telefone: data.telefone,

          // Plano SaaS
          planoSaaS: data.planoSaaS,
          valorPlanoMensal: data.valorPlanoMensal,
          dataInicioPlano: new Date(),
          dataProximoCobranca: new Date(new Date().setMonth(new Date().getMonth() + 1)),

          // Valores dos alunos
          valorMensalidadeFutebol: data.valorMensalidadeFutebol,
          valorMensalidadeCrossfit: data.valorMensalidadeCrossfit,
          valorAulaExtraPadrao: data.valorAulaExtraPadrao,
          diaVencimento: data.diaVencimento,

          // Módulos
          aulasExtrasAtivas: data.aulasExtrasAtivas || false,
          crossfitAtivo: data.crossfitAtivo || false,
        },
      });

      // 2. Cria o ADMIN da escolinha
      await tx.user.create({
        data: {
          email: data.adminEmail,
          name: data.adminName,
          password: hashedPassword,
          role: 'ADMIN',
          escolinhaId: escolinha.id,
          img: null,
        },
      });

      return escolinha;
    });
  }

  async listarTodas() {
    return await prisma.escolinha.findMany({
      select: {
        id: true,
        nome: true,
        endereco: true,
        logoUrl: true,
        tipoDocumento: true,
        documento: true,
        nomeResponsavel: true,
        emailContato: true,
        telefone: true,
        planoSaaS: true,
        valorPlanoMensal: true,
        statusPagamentoSaaS: true,
        dataInicioPlano: true,
        dataProximoCobranca: true,
        aulasExtrasAtivas: true,
        crossfitAtivo: true,
        createdAt: true,
        updatedAt: true,
        // Contagem de alunos (para exibir total)
        _count: {
          select: {
            alunosFutebol: true,
            alunosCrossfit: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async buscarPorId(id: string) {
    const escolinha = await prisma.escolinha.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        endereco: true,
        logoUrl: true,
        tipoDocumento: true,
        documento: true,
        nomeResponsavel: true,
        emailContato: true,
        telefone: true,
        planoSaaS: true,
        valorPlanoMensal: true,
        statusPagamentoSaaS: true,
        dataInicioPlano: true,
        dataProximoCobranca: true,
        aulasExtrasAtivas: true,
        crossfitAtivo: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            alunosFutebol: true,
            alunosCrossfit: true,
            users: true, // admins/treinadores
          },
        },
      },
    });

    if (!escolinha) {
      throw new Error("Escolinha não encontrada");
    }

    return escolinha;
  }

  // Atualizar Plano SaaS
async atualizarPlano(id: string, planoSaaS: string, valorPlanoMensal: number) {
  const planoValido = ["basico", "pro", "enterprise"].includes(planoSaaS);
  if (!planoValido) {
    throw new Error("Plano SaaS inválido");
  }

  return await prisma.$transaction(async (tx) => {
    const escolinha = await tx.escolinha.findUnique({
      where: { id },
      select: { planoSaaS: true },
    });

    if (!escolinha) {
      throw new Error("Escolinha não encontrada");
    }

    const atualizada = await tx.escolinha.update({
      where: { id },
      data: {
        planoSaaS,
        valorPlanoMensal,
        dataProximoCobranca: new Date(new Date().setMonth(new Date().getMonth() + 1)), // reinicia cobrança
      },
    });

    // Log de mudança de plano (opcional, pode salvar em tabela de logs)
    console.log(`Plano atualizado para ${planoSaaS} - R$${valorPlanoMensal} - Escolinha: ${id}`);

    return atualizada;
  });
}

// Suspender Pagamento
async suspenderPagamento(id: string) {
  const escolinha = await prisma.escolinha.findUnique({
    where: { id },
    select: { statusPagamentoSaaS: true },
  });

  if (!escolinha) {
    throw new Error("Escolinha não encontrada");
  }

  if (escolinha.statusPagamentoSaaS === "suspenso") {
    throw new Error("Pagamento já está suspenso");
  }

  return await prisma.escolinha.update({
    where: { id },
    data: {
      statusPagamentoSaaS: "suspenso",
    },
  });
}

  // Futuras funções: listarEscolinhas, atualizarPlano, suspenderPagamento, etc
}