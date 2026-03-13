// src/services/tenant/aula-extra-aluno.service.ts
import { prisma } from '../../config/database';
import { CreateAulaExtraAlunoDTO, UpdateAulaExtraAlunoDTO } from '../../dto/tenant/aulas-extras-alunos-professor.dto';


export class AulaExtraAlunoService {
  async create(data: CreateAulaExtraAlunoDTO) {
    console.log('[SERVICE] Criando inscrição Aula Extra Aluno:', data);

    return prisma.aulaExtraAluno.create({
      data: {
        aulaExtraId: data.aulaExtraId,
        alunoId: data.alunoId,
        funcionarioTreinadorId: data.funcionarioTreinadorId,
        dataAula: data.dataAula ? new Date(data.dataAula) : null,
        status: data.status,
        observacao: data.observacao,
        pagamentoId: data.pagamentoId,
      },
    });
  }

  async update(id: string, data: UpdateAulaExtraAlunoDTO) {
    console.log('[SERVICE] Atualizando inscrição Aula Extra Aluno:', { ...data });

    return prisma.aulaExtraAluno.update({
      where: { id },
      data: {
        dataAula: data.dataAula ? new Date(data.dataAula) : undefined,
        status: data.status,
        observacao: data.observacao,
        pagamentoId: data.pagamentoId,
        alunoId: data.alunoId,
        funcionarioTreinadorId: data.funcionarioTreinadorId,
      },
    });
  }

  async delete(id: string) {
    console.log('[SERVICE] Deletando inscrição Aula Extra Aluno:', id);

    return prisma.aulaExtraAluno.delete({
      where: { id },
    });
  }

  async getAllByAula(aulaExtraId: string) {
    return prisma.aulaExtraAluno.findMany({
      where: { aulaExtraId },
      include: {
        aluno: { select: { nome: true, id: true } },
        funcionarioTreinador: { select: { nome: true, id: true } },
        pagamento: { select: { valor: true, status: true, id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    return prisma.aulaExtraAluno.findUnique({
      where: { id },
      include: {
        aluno: true,
        funcionarioTreinador: true,
        pagamento: true,
        aulaExtra: true,
      },
    });
  }
}

export const aulaExtraAlunoService = new AulaExtraAlunoService();