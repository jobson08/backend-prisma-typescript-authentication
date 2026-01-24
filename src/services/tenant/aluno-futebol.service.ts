import bcrypt from 'bcrypt';
import { CreateAlunoFutebolDto, UpdateAlunoFutebolDto } from '../../dto/tenant/aluno-futebol.dto';
import { prisma } from '../../server';

export class AlunoFutebolService {
  async create(escolinhaId: string, data: CreateAlunoFutebolDto) {
    let dataNascimento: Date;
    if (data.dataNascimento.includes("/")) {
      const [day, month, year] = data.dataNascimento.split("/");
      dataNascimento = new Date(`${year}-${month}-${day}`);
    } else {
      dataNascimento = new Date(data.dataNascimento);
    }

    if (isNaN(dataNascimento.getTime())) {
      throw new Error("Data de nascimento inválida");
    }

    const aluno = await prisma.alunoFutebol.create({
      data: {
        nome: data.nome,
        cpf: data.cpf,
        dataNascimento,
        categoria: data.categoria,
        telefone: data.telefone,
        email: data.email.toLowerCase().trim(),
        observacoes: data.observacoes,
        status: "ativo",
        escolinhaId,
        responsavelId: data.responsavelId || null,
      },
    });

    const senhaTemporaria = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(senhaTemporaria, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        name: data.nome,
        password: hashedPassword,
        role: "ALUNO_FUTEBOL",
        escolinhaId,
      },
    });

    await prisma.alunoFutebol.update({
      where: { id: aluno.id },
      data: { userId: user.id },
    });

    return {
      ...aluno,
      senhaTemporaria,
    };
  }

  async list(escolinhaId: string) {
    return prisma.alunoFutebol.findMany({
      where: { escolinhaId },
      include: { responsavel: true },
      orderBy: { nome: 'asc' },
    });
  }

  async getById(escolinhaId: string, id: string) {
    const aluno = await prisma.alunoFutebol.findFirst({
      where: {
        id,
        escolinhaId,
      },
      include: { responsavel: true, user: true },
    });

    if (!aluno) {
      throw new Error("Aluno não encontrado");
    }

    return aluno;
  }

  async update(escolinhaId: string, id: string, data: UpdateAlunoFutebolDto) {
    const aluno = await prisma.alunoFutebol.findFirst({
      where: {
        id,
        escolinhaId,
      },
    });

    if (!aluno) {
      throw new Error("Aluno não encontrado");
    }

    // Atualiza apenas os campos enviados
    const updated = await prisma.alunoFutebol.update({
      where: { id },
      data: {
        nome: data.nome,
        cpf: data.cpf,
        dataNascimento: data.dataNascimento ? new Date(data.dataNascimento) : undefined,
        categoria: data.categoria,
        telefone: data.telefone,
        email: data.email ? data.email.toLowerCase().trim() : undefined,
        observacoes: data.observacoes,
        status: data.status,
        responsavelId: data.responsavelId !== undefined ? (data.responsavelId || null) : undefined,
      },
    });

    // Se mudou o e-mail, atualiza o user também (opcional)
    if (data.email && data.email !== aluno.email) {
      await prisma.user.update({
        where: { id: aluno.userId! },
        data: { email: data.email.toLowerCase().trim() },
      });
    }

    return updated;
  }

  async delete(escolinhaId: string, id: string) {
  const aluno = await prisma.alunoFutebol.findFirst({
    where: {
      id,
      escolinhaId,
    },
  });

  if (!aluno) {
    throw new Error("Aluno não encontrado");
  }

      // Se tem user associado, deleta ele primeiro
      if (aluno.userId) {
        await prisma.$transaction([
          prisma.alunoFutebol.delete({ where: { id } }),
          prisma.user.delete({ where: { id: aluno.userId } }),
        ]);
      } else {
        // Sem user associado → deleta só o aluno
        await prisma.alunoFutebol.delete({ where: { id } });
      }

      return { message: "Aluno deletado com sucesso" };
    }
  }
