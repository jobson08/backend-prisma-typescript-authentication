// src/services/tenant/funcionario.service.ts
import { prisma } from '../../config/database';
import { CreateFuncionarioDto, UpdateFuncionarioDto } from '../../dto/tenant/funcionario.dto';
import bcrypt from 'bcrypt';

export class FuncionarioService {
  async create(escolinhaId: string, data: CreateFuncionarioDto) {
    const emailLower = data.email.toLowerCase();

    // Verifica duplicidade de email
    const existing = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (existing) {
      throw new Error('E-mail já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: emailLower,
          password: hashedPassword,
          name: data.nome,
          role: 'FUNCIONARIO',
          escolinha: { connect: { id: escolinhaId } },
        },
      });

      const funcionario = await tx.funcionario.create({
        data: {
          nome: data.nome,
          cargo: data.cargo,
          salario: data.salario,
          telefone: data.telefone,
          observacoes: data.observacoes,
          fotoUrl: data.fotoUrl,
          email: emailLower,
          escolinhaId,
          userId: user.id,
        },
      });

      return funcionario;
    });

    return result;
  }

  async list(escolinhaId: string) {
    return prisma.funcionario.findMany({
      where: { escolinhaId },
      orderBy: { nome: 'asc' },
    });
  }

  async findById(escolinhaId: string, id: string) {
    const funcionario = await prisma.funcionario.findFirst({
      where: { id, escolinhaId },
      include: { user: true },
    });

    if (!funcionario) {
      throw new Error('Funcionário não encontrado');
    }

    return funcionario;
  }

  async update(escolinhaId: string, id: string, data: UpdateFuncionarioDto) {
    const funcionario = await prisma.funcionario.findFirst({
      where: { id, escolinhaId },
      include: { user: true },
    });

    if (!funcionario) {
      throw new Error('Funcionário não encontrado');
    }

    const updateData: any = {};

    if (data.nome !== undefined) updateData.nome = data.nome.trim();
    if (data.telefone !== undefined) updateData.telefone = data.telefone?.trim() || null;
    if (data.cargo !== undefined) updateData.cargo = data.cargo;
    if (data.salario !== undefined) updateData.salario = data.salario;
    if (data.observacoes !== undefined) updateData.observacoes = data.observacoes?.trim() || null;
    if (data.fotoUrl !== undefined) updateData.fotoUrl = data.fotoUrl?.trim() || null;

    // Se enviou nova senha, atualiza no User
    if (data.password) {
      if (!funcionario.user) {
        throw new Error('Funcionário não possui login associado');
      }

      const hashed = await bcrypt.hash(data.password, 10);

      await prisma.user.update({
        where: { id: funcionario.user.id },
        data: { password: hashed },
      });
    }

    const funcionarioAtualizado = await prisma.funcionario.update({
      where: { id },
      data: updateData,
    });

    return funcionarioAtualizado;
  }

  async delete(escolinhaId: string, id: string) {
    const funcionario = await prisma.funcionario.findFirst({
      where: { id, escolinhaId },
    });

    if (!funcionario) {
      throw new Error('Funcionário não encontrado');
    }

    await prisma.funcionario.delete({ where: { id } });
  }
}