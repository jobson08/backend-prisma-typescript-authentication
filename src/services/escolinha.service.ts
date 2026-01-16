// src/services/escolinha.service.ts
import { prisma } from '../config/database';
import bcrypt from 'bcrypt';

// O DTO antigo pode ser mantido para validação, mas o service usa tipos do Prisma
import { CreateEscolinhaDto } from '../dto/create-escolinha.dto';
import { Prisma } from '../../generated/prisma';

export class EscolinhaService {
  // Aceita qualquer input compatível com Prisma (sem tipo rígido)
  async criarEscolinha(data: any) {  // ou Prisma.EscolinhaCreateInput se quiser forçar
    const hashedPassword = await bcrypt.hash(data.adminPassword, 12);

    return await prisma.$transaction(async (tx) => {
      const agora = new Date();

      const escolinha = await tx.escolinha.create({
        data: {
          nome: data.nome,
          endereco: data.endereco,
          tipoDocumento: data.tipoDocumento,
          documento: data.documento,
          cidade: data.cidade ?? null,
          estado: data.estado ?? null,
          observacoes: data.observacoes ?? null,
          nomeResponsavel: data.nomeResponsavel,
          emailContato: data.emailContato,
          telefone: data.telefone,

          planoSaaS: data.planoSaaS,
          valorPlanoMensal: data.valorPlanoMensal,
          dataInicioPlano: data.dataInicioPlano || agora,
          dataProximoCobranca: data.dataProximoCobranca || new Date(agora.setMonth(agora.getMonth() + 1)),
          statusPagamentoSaaS: data.statusPagamentoSaaS || "ativo",

          valorMensalidadeFutebol: data.valorMensalidadeFutebol,
          valorMensalidadeCrossfit: data.valorMensalidadeCrossfit,
          valorAulaExtraPadrao: data.valorAulaExtraPadrao,
          diaVencimento: data.diaVencimento,

          aulasExtrasAtivas: data.aulasExtrasAtivas || false,
          crossfitAtivo: data.crossfitAtivo || false,
        },
      });

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

  /**
   * Lista todas as escolinhas com campos selecionados
   */
  async listarTodas() {
    return await prisma.escolinha.findMany({
      select: {
        id: true,
        nome: true,
        endereco: true,
        cidade: true,
        estado: true,
        observacoes: true,
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
        // Contagem de alunos
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

  /**
   * Busca uma escolinha por ID com campos completos
   */
  async buscarPorId(id: string) {
    console.log("[Service] Buscando escolinha ID:", id);

    const escolinha = await prisma.escolinha.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        endereco: true,
        cidade: true,
        estado: true,
        observacoes: true,
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
            users: true,
          },
        },
      },
    });

    if (!escolinha) {
      console.log("[Service] Escolinha NÃO encontrada para ID:", id);
      throw new Error("Escolinha não encontrada");
    }

    console.log("[Service] Escolinha encontrada:", escolinha.id);
    return escolinha;
  }

  /**
   * Atualiza uma escolinha (campos parciais)
   */
  async atualizarEscolinha(id: string, data: Prisma.EscolinhaUpdateInput) {
    const escolinha = await prisma.escolinha.findUnique({ where: { id } });
    if (!escolinha) {
      throw new Error("Escolinha não encontrada");
    }

    return await prisma.escolinha.update({
      where: { id },
      data,
    });
  }

  /**
   * Atualiza apenas o plano SaaS e reinicia cobrança
   */
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
          dataProximoCobranca: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        },
      });

      console.log(`Plano atualizado para ${planoSaaS} - R$${valorPlanoMensal} - Escolinha: ${id}`);
      return atualizada;
    });
  }

  /**
   * Suspende pagamento SaaS
   */
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

  // Futuras funções podem ser adicionadas aqui
}