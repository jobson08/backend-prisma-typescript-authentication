// src/services/escolinha.service.ts
import { prisma } from '../../config/database';
import bcrypt from 'bcrypt';
import { CreateEscolinhaDto } from '../../dto/create-escolinha.dto';

export class EscolinhaService {
  async criarEscolinha(data: CreateEscolinhaDto) {
    const hashedPassword = await bcrypt.hash(data.adminPassword, 12);

    return await prisma.$transaction(async (tx) => {
      const agora = new Date();

      // Cria a escolinha
      const escolinha = await tx.escolinha.create({
        data: {
          nome: data.nome,
          endereco: data.endereco,
          tipoDocumento: data.tipoDocumento,
          documento: data.documento,
          cidade: data.cidade,           // Prisma trata undefined como null
          estado: data.estado,
          observacoes: data.observacoes,
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

      // Cria o admin vinculado
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async buscarPorId(id: string) {
   // console.log("[Service] Buscando escolinha ID:", id);

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

    //console.log("[Service] Escolinha encontrada:", escolinha.id);
    return escolinha;
  }

  async atualizarEscolinha(id: string, data: any) {  // ← use any aqui (mais seguro e evita o erro)
  const escolinha = await prisma.escolinha.findUnique({ where: { id } });
  if (!escolinha) {
    throw new Error("Escolinha não encontrada");
  }

  // Validação básica (opcional, mas recomendado)
  if (data.planoSaaS && !["basico", "pro", "enterprise"].includes(data.planoSaaS)) {
    throw new Error("Plano SaaS inválido");
  }

  return await prisma.escolinha.update({
    where: { id },
    data,
  });
}

  async atualizarPlano(id: string, planoSaaS: string, valorPlanoMensal: number) {
    const planosValidos = ["basico", "pro", "enterprise"];
    if (!planosValidos.includes(planoSaaS)) {
      throw new Error("Plano SaaS inválido");
    }

    const escolinha = await prisma.escolinha.findUnique({ where: { id } });
    if (!escolinha) {
      throw new Error("Escolinha não encontrada");
    }

    const novaDataProximoCobranca = new Date();
    novaDataProximoCobranca.setMonth(novaDataProximoCobranca.getMonth() + 1);

    return await prisma.escolinha.update({
      where: { id },
      data: {
        planoSaaS,
        valorPlanoMensal,
        dataProximoCobranca: novaDataProximoCobranca,
      },
    });
  }

 async suspenderPagamento(id: string, motivo?: string) {
  try {
    const escolinha = await prisma.escolinha.findUnique({
      where: { id },
    });

    if (!escolinha) {
      throw new Error('Escolinha não encontrada');
    }

    if (escolinha.statusPagamentoSaaS === 'suspenso') {
      throw new Error('Escolinha já está suspensa');
    }

    const atualizada = await prisma.escolinha.update({
      where: { id },
      data: {
        statusPagamentoSaaS: 'suspenso',
        // Se tiver campo para motivo ou data de suspensão
        // suspensaoMotivo: motivo || null,
        // dataSuspensao: new Date(),
      },
    });

  //  console.log(`[SUSPENDER PAGAMENTO] Escolinha ${id} suspensa. Motivo: ${motivo || 'não informado'}`);
    return atualizada;
  } catch (err: unknown) {
    console.error('[SUSPENDER PAGAMENTO ERROR]', err);
    throw err;
  }
}
}