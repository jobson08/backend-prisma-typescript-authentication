// src/services/tenant/aluno-crossfit.service.ts
import bcrypt from 'bcrypt';
import { prisma } from '../../server';
import { CreateAlunoCrossfitDTO, UpdateAlunoCrossfitDTO } from '../../dto/tenant/aluno-crossfit.dto';


export class AlunoCrossfitService {
  async create(escolinhaId: string, data: CreateAlunoCrossfitDTO) {
    // Conversão de dataNascimento
    let dataNascimento: Date;
    if (data.dataNascimento.includes('/')) {
      const [day, month, year] = data.dataNascimento.split('/');
      dataNascimento = new Date(`${year}-${month}-${day}`);
    } else {
      dataNascimento = new Date(data.dataNascimento);
    }

    if (isNaN(dataNascimento.getTime())) {
      throw new Error('Data de nascimento inválida');
    }

    // Verifica unicidade de email e CPF (dentro da escolinha)
    const existing = await prisma.alunoCrossfit.findFirst({
      where: {
        OR: [
          { email: data.email.toLowerCase().trim() },
          ...(data.cpf ? [{ cpf: data.cpf.replace(/\D/g, '') }] : []),
        ],
        escolinhaId,
      },
    });

    if (existing) {
      throw new Error('E-mail ou CPF já cadastrado nesta escolinha');
    }

    // Cria o aluno
    const aluno = await prisma.alunoCrossfit.create({
      data: {
        nome: data.nome.trim(),
        cpf: data.cpf ? data.cpf.replace(/\D/g, '') : null,
        email: data.email.toLowerCase().trim(),
        telefone: data.telefone ? data.telefone.replace(/\D/g, '') : null,
        dataNascimento,
        observacoes: data.observacoes?.trim() || null,
        frequencia: data.frequencia ?? 0,
        status: data.status ?? 'ativo',
        escolinhaId,
      },
    });

    // Gera senha temporária e cria usuário associado
    const senhaTemporaria = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(senhaTemporaria, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        name: data.nome.trim(),
        password: hashedPassword,
        role: 'ALUNO_CROSSFIT',
        escolinhaId,
      },
    });

    // Associa o user ao aluno
    await prisma.alunoCrossfit.update({
      where: { id: aluno.id },
      data: { userId: user.id },
    });

    // Retorna aluno + senha temporária
    return {
      ...aluno,
      senhaTemporaria,
    };
  }

  async list(escolinhaId: string) {
    return prisma.alunoCrossfit.findMany({
      where: { escolinhaId },
      orderBy: { nome: 'asc' },
      include: {
        mensalidades: {
          orderBy: { dataVencimento: 'desc' },
          take: 1,
        },
        presencas: {
          orderBy: { data: 'desc' },
          take: 5,
        },
      },
    });
  }

  async getById(escolinhaId: string, id: string) {
    const aluno = await prisma.alunoCrossfit.findFirst({
      where: {
        id,
        escolinhaId,
      },
      include: {
        mensalidades: {
          orderBy: { dataVencimento: 'desc' },
        },
        presencas: {
          orderBy: { data: 'desc' },
          take: 5,
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!aluno) {
      throw new Error('Aluno de CrossFit não encontrado');
    }

    return aluno;
  }

  async update(escolinhaId: string, id: string, data: UpdateAlunoCrossfitDTO) {
    const aluno = await prisma.alunoCrossfit.findFirst({
      where: {
        id,
        escolinhaId,
      },
    });

    if (!aluno) {
      throw new Error('Aluno de CrossFit não encontrado');
    }

    // Se alterar email ou CPF, verifica unicidade
    if (data.email || data.cpf) {
      const existing = await prisma.alunoCrossfit.findFirst({
        where: {
          OR: [
            ...(data.email ? [{ email: data.email.toLowerCase().trim() }] : []),
            ...(data.cpf ? [{ cpf: data.cpf.replace(/\D/g, '') }] : []),
          ],
          escolinhaId,
          id: { not: id },
        },
      });

      if (existing) {
        throw new Error('E-mail ou CPF já cadastrado nesta escolinha');
      }
    }

    // Atualiza apenas os campos enviados
    const updated = await prisma.alunoCrossfit.update({
      where: { id },
      data: {
        nome: data.nome,
        cpf: data.cpf ? data.cpf.replace(/\D/g, '') : undefined,
        email: data.email ? data.email.toLowerCase().trim() : undefined,
        telefone: data.telefone ? data.telefone.replace(/\D/g, '') : undefined,
        dataNascimento: data.dataNascimento ? new Date(data.dataNascimento) : undefined,
        observacoes: data.observacoes,
        frequencia: data.frequencia,
        status: data.status,
      },
    });

    // Se mudou o e-mail, atualiza o user também
    if (data.email && data.email.toLowerCase().trim() !== aluno.email) {
      await prisma.user.update({
        where: { id: aluno.userId! },
        data: { email: data.email.toLowerCase().trim() },
      });
    }

    return updated;
  }

  async delete(escolinhaId: string, id: string) {
    const aluno = await prisma.alunoCrossfit.findFirst({
      where: {
        id,
        escolinhaId,
      },
    });

    if (!aluno) {
      throw new Error('Aluno de CrossFit não encontrado');
    }

    // Se tem user associado, deleta ele primeiro (transação)
    if (aluno.userId) {
      await prisma.$transaction([
        prisma.alunoCrossfit.delete({ where: { id } }),
        prisma.user.delete({ where: { id: aluno.userId } }),
      ]);
    } else {
      await prisma.alunoCrossfit.delete({ where: { id } });
    }

    return { message: 'Aluno de CrossFit deletado com sucesso' };
  }
}

export const alunoCrossfitService = new AlunoCrossfitService();