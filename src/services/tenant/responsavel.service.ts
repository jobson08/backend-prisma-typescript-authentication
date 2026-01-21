// src/services/responsavel.service.ts
import { prisma } from '../../config/database';

import bcrypt from 'bcrypt';
import { CreateResponsavelDto, UpdateResponsavelDto } from '../../dto/tenant/responsavel.dto';

export class ResponsavelService {
 async create(escolinhaId: string, data: CreateResponsavelDto) {
  let userId = null;

  // Se email e password foram fornecidos, cria User
  if (data.email && data.password) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        name: data.nome,
        password: hashedPassword,
        role: 'RESPONSAVEL',
        escolinhaId,
      },
    });
    userId = user.id;
  }

  // Cria o Responsável – converte undefined para null
  const responsavel = await prisma.responsavel.create({
    data: {
      nome: data.nome,
      cpf: data.cpf ?? null,
      email: data.email ?? null,
      telefone: data.telefone ?? null,
      fotoUrl: null,
      observacoes: data.observacoes ?? null,
      escolinhaId,
      userId,
    },
  });

  return responsavel;
}

  async list(escolinhaId: string) {
    return prisma.responsavel.findMany({
      where: { escolinhaId },
      orderBy: { nome: 'asc' },
      include: { filhos: true, user: true }, // inclui filhos (alunos) e login
    });
  }

  async findById(escolinhaId: string, responsavelId: string) {
    const responsavel = await prisma.responsavel.findFirst({
      where: {
        id: responsavelId,
        escolinhaId,
      },
      include: { filhos: true, user: true },
    });

    if (!responsavel) {
      throw new Error('Responsável não encontrado ou não pertence à escolinha');
    }

    return responsavel;
  }

  async update(escolinhaId: string, responsavelId: string, data: UpdateResponsavelDto) {
    await this.findById(escolinhaId, responsavelId); // valida existência

    return prisma.responsavel.update({
      where: { id: responsavelId },
      data,
    });
  }

  async delete(escolinhaId: string, responsavelId: string) {
    await this.findById(escolinhaId, responsavelId); // valida

    await prisma.responsavel.delete({
      where: { id: responsavelId },
    });

    return { message: 'Responsável excluído com sucesso' };
  }
}