// src/services/responsavel.service.ts
import { prisma } from '../config/database';
import { CreateResponsavelDto } from '../dto/responsavel.dto';

export const responsavelService = {
  async create(dto: CreateResponsavelDto, tenantId: string) {
    return await prisma.responsavel.create({
data: {
      tenantId,
      name: dto.name,
      phone: dto.phone,
      email: dto.email ?? null,
      cpf: dto.cpf ?? null,
      relacionamento: dto.relacionamento ?? null,
      observations: dto.observations ?? null,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      cpf: true,
      relacionamento: true,     // ← pode selecionar agora
      observations: true,
      createdAt: true,
    },
  });
},
  async getAll(tenantId: string) {
    return await prisma.responsavel.findMany({
      where: { tenantId },
        select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            cpf: true,
            relacionamento: true,     // ← agora funciona
            _count: { select: { alunos: true } },
      },
      orderBy: { name: 'asc' },
    });
  },

  async getById(id: string, tenantId: string) {
    const responsavel = await prisma.responsavel.findUnique({
      where: { id, tenantId },
      include: { alunos: { select: { id: true, name: true } } },
    });

    if (!responsavel) throw new Error('Responsável não encontrado');
    return responsavel;
  },

  async update(id: string, dto: Partial<CreateResponsavelDto>, tenantId: string) {
    return await prisma.responsavel.update({
      where: { id, tenantId },
      data: dto,
      select: { id: true, name: true, phone: true, email: true },
    });
  },

  async delete(id: string, tenantId: string) {
    // Verifica se tem alunos vinculados
    const count = await prisma.aluno.count({ where: { responsavelId: id } });
    if (count > 0) {
      throw new Error('Não é possível excluir: responsável tem alunos vinculados');
    }

    await prisma.responsavel.delete({ where: { id, tenantId } });
    return { success: true, message: 'Responsável excluído com sucesso' };
  },
};