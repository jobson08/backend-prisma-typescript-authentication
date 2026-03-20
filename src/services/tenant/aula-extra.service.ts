// src/services/tenant/aula-extra.service.ts
//import { prisma } from '../../config/database';
import { CreateAulaExtraDTO, UpdateAulaExtraDTO, UpdateAulasExtrasConfigDTO } from '../../dto/tenant/aulas-extras.dto';
import { prisma } from '../../server';

export class AulaExtraService {
  async create(escolinhaId: string, data: CreateAulaExtraDTO) {
    console.log('[SERVICE] Criando Aula Extra:', { escolinhaId, ...data });

    return prisma.aulaExtra.create({
      data: {
        nome: data.nome,
        duracao: data.duracao,
        valor: data.valor,
        descricao: data.descricao,
        escolinhaId,
        status: 'agendada',
      },
    });
  }

  async update(id: string, escolinhaId: string, data: UpdateAulaExtraDTO) {
    console.log('[SERVICE] Atualizando Aula Extra:', {id, escolinhaId, ...data });

    return prisma.aulaExtra.update({
      where: {
        id,
        escolinhaId,
      },
      data: {
        nome: data.nome,
        duracao: data.duracao,
        valor: data.valor,
        descricao: data.descricao,
        status: data.status,
      },
    });
  }

  async delete(id: string, escolinhaId: string) {
    console.log('[SERVICE] Deletando Aula Extra:', { id, escolinhaId });

    return prisma.aulaExtra.delete({
      where: {
        id,
        escolinhaId,
      },
    });
  }

  async getAll(escolinhaId: string) {
    return prisma.aulaExtra.findMany({
      where: { escolinhaId },
      include: {
        _count: {
    select: { inscricoes: true }  // ou o nome real da relação (AulaExtraAluno?)
  }
},
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string, escolinhaId: string) {
    return prisma.aulaExtra.findFirst({
      where: {
        id,
        escolinhaId,
      },
    });
  }

  async updateAulasExtrasConfig(escolinhaId: string, data: UpdateAulasExtrasConfigDTO) {
    console.log('[SERVICE] Atualizando config de Aulas Extras:', { escolinhaId, ...data });

    // Atualiza flag de ativação
    await prisma.escolinha.update({
      where: { id: escolinhaId },
      data: {
        aulasExtrasAtivas: data.ativarAulasExtras,
      },
    });

    // Limpa aulas antigas (se quiser substituir tudo)
    await prisma.aulaExtra.deleteMany({
      where: { escolinhaId },
    });

    // Cria novas aulas (se houver)
    if (data.aulas && data.aulas.length > 0) {
      await prisma.aulaExtra.createMany({
        data: data.aulas.map((aula) => ({
          nome: aula.nome,
          duracao: aula.duracao,
          valor: aula.valor,
          descricao: aula.descricao,
          escolinhaId,
          status: 'agendada',
        })),
      });
    }

    return prisma.escolinha.findUnique({
      where: { id: escolinhaId },
      select: { aulasExtrasAtivas: true },
    });
  }

  async toggleAulasExtrasActivation(escolinhaId: string, ativar: boolean) {
  console.log('[SERVICE] Toggle ativação Aulas Extras:', { escolinhaId, ativar });

  return prisma.escolinha.update({
    where: { id: escolinhaId },
    data: { aulasExtrasAtivas: ativar },
  });
}
}

export const aulaExtraService = new AulaExtraService();