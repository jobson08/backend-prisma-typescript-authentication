// src/services/aluno.service.ts
import { prisma } from '../config/database';
import { CreateAlunoDto } from '../dto/create-aluno.dto';

export const alunoService = {
    //cadastrar aluno
  async create(dto: CreateAlunoDto, tenantId: string) {
    // Verifica se o responsável pertence ao mesmo tenant
    const responsavel = await prisma.responsavel.findUnique({
      where: { id: dto.responsavelId },
      select: { tenantId: true },
    });

    if (!responsavel || responsavel.tenantId !== tenantId) {
      throw new Error('Responsável não encontrado ou não pertence a este tenant');
    }

    return await prisma.aluno.create({
      data: {
        ...dto,
        birthDate: new Date(dto.birthDate),
        tenantId,
      },
      select: {
        id: true,
        name: true,
        birthDate: true,
        phone: true,
        status: true,
        observations: true,
        createdAt: true,
        responsavel: {
          select: { id: true, name: true, phone: true, relacionamento: true },
        },
      },
    });
  },

  //verificar aluno
  async getAll(tenantId: string) {
    return await prisma.aluno.findMany({
      where: { tenantId },
      include: {
        responsavel: {
          select: { id: true, name: true, phone: true, relacionamento: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  },

  //verificar aluno por Id
  async getById(id: string, tenantId: string) {
    const aluno = await prisma.aluno.findUnique({
      where: { id, tenantId },
      include: {
        responsavel: {
          select: { id: true, name: true, phone: true, relacionamento: true },
        },
      },
    });

    if (!aluno) throw new Error('Aluno não encontrado');
    return aluno;
  },

 //editar aluno
 async update(id: string, dto: Partial<CreateAlunoDto>, tenantId: string) {
  // SE estiver mudando o responsável → valida se existe e se é do mesmo tenant
  if (dto.responsavelId !== undefined) { // ← mudou ou removeu o responsável
    if (dto.responsavelId === null) {
      // Permitir remover o responsável (aluno maior de idade)
      // não faz nada aqui, só deixa null
    } else {
      // Tem um novo responsável → valida
      const responsavel = await prisma.responsavel.findUnique({
        where: { id: dto.responsavelId },
        select: { tenantId: true },
      });

      // CORREÇÃO AQUI: verifica se existe e se pertence ao tenant
      if (!responsavel) {
        throw new Error('Responsável não encontrado');
      }
      if (responsavel.tenantId !== tenantId) {
        throw new Error('Responsável não pertence a este tenant');
      }
    }
  }

  return await prisma.aluno.update({
    where: { id, tenantId },
    data: {
      name: dto.name,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      phone: dto.phone,
      responsavelId: dto.responsavelId ?? undefined, // ← aceita null ou undefined
      observations: dto.observations,
      status: dto.status,
    },
    include: {
      responsavel: {
        select: { id: true, name: true, phone: true, relacionamento: true },
      },
    },
  });
},

//Deletar  aluno
  async delete(id: string, tenantId: string) {
    const aluno = await prisma.aluno.findUnique({
      where: { id, tenantId },
      select: { id: true },
    });

    if (!aluno) throw new Error('Aluno não encontrado');

    await prisma.aluno.delete({ where: { id } });
  },
};