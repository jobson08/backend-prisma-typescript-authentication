// src/services/tenant/aula-extra.service.ts
import { prisma } from '../../config/database';
import { CreateAulaExtraDTO, UpdateAulaExtraDTO } from '../../dto/tenant/aulas-extras.dto';


export class AulaExtraService {
 async create(escolinhaId: string, data: CreateAulaExtraDTO) {
  console.log('[SERVICE] Criando Aula Extra:', { escolinhaId, ...data });

  return prisma.aulaExtra.create({
    data: {
      nome: data.nome,
      duracao: data.duracao,           // ← minúsculo, igual ao schema
      valor: data.valor,
      descricao: data.descricao || null, // ← minúsculo
      alunoId: data.alunoId || null,
      funcionarioTreinadorId: data.funcionarioTreinadorId,
      escolinhaId,
      status: 'agendada',
    },
  });
}

  async update(id: string, escolinhaId: string, data: UpdateAulaExtraDTO) {
    console.log('[SERVICE] Atualizando Aula Extra:', {  escolinhaId, ...data });

    return prisma.aulaExtra.update({
      where: {
        id,
        escolinhaId, // segurança multi-tenant
      },
      data: {
        nome: data.nome,
        duracao: data.duracao,
        valor: data.valor,
        descricao: data.descricao,
        alunoId: data.alunoId,
        funcionarioTreinadorId: data.funcionarioTreinadorId,
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
        aluno: { select: { nome: true } },
        funcionarioTreinador: { select: { nome: true } },
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
      include: {
        aluno: { select: { nome: true } },
        funcionarioTreinador: { select: { nome: true } },
      },
    });
  }
}

export const aulaExtraService = new AulaExtraService();