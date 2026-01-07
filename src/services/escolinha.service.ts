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

  // Futuras funções: listarEscolinhas, atualizarPlano, suspenderPagamento, etc
}