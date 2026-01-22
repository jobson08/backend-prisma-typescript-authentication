import bcrypt from 'bcrypt';
import { CreateAlunoDto, UpdateAlunoDto } from '../../dto/tenant/aluno-futebol.dto';
import { prisma } from '../../server';

export class AlunoService {
  async create(escolinhaId: string, data: CreateAlunoDto) {
    let userId: string | null = null;

    if (data.email && data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await prisma.user.create({
        data: {
          email: data.email.toLowerCase().trim(),
          name: data.nome,
          password: hashedPassword,
          role: 'ALUNO_FUTEBOL',
          escolinhaId,
        },
      });
      userId = user.id;
    }

    // responsavelId é obrigatório no schema → lança erro se não vier
    if (!data.responsavelId) {
      throw new Error('Responsável é obrigatório para criar aluno');
    }

    const aluno = await prisma.alunoFutebol.create({
      data: {
        nome: data.nome,
        dataNascimento: data.dataNascimento,
        telefone: data.telefone ?? null, // aceita null (campo opcional)
        cpf: data.cpf ?? null,
        categoria: data.categoria,
        frequenciaMes: 0,
        mediaAvaliacao: 0,
        observacoes: data.observacoes ?? null,
        status: data.status,
        escolinhaId,
        responsavelId: data.responsavelId, // obrigatório → sem null
        userId,
      },
    });

    return aluno;
  }

  async list(escolinhaId: string) {
    return prisma.alunoFutebol.findMany({
      where: { escolinhaId },
      orderBy: { nome: 'asc' },
      include: {
        responsavel: true,
        user: true,
      },
    });
  }

  async findById(escolinhaId: string, alunoId: string) {
    const aluno = await prisma.alunoFutebol.findFirst({
      where: {
        id: alunoId,
        escolinhaId,
      },
      include: {
        responsavel: true,
        user: true,
      },
    });

    if (!aluno) {
      throw new Error('Aluno não encontrado ou não pertence à escolinha');
    }

    return aluno;
  }

  async update(escolinhaId: string, alunoId: string, data: UpdateAlunoDto) {
    await this.findById(escolinhaId, alunoId);

    // Monta objeto de update dinâmico (só campos que vieram)
    const updateData: any = {};

    if (data.nome !== undefined) updateData.nome = data.nome;
    if (data.dataNascimento !== undefined) updateData.dataNascimento = data.dataNascimento;
    if (data.telefone !== undefined) updateData.telefone = data.telefone ?? null;
    if (data.cpf !== undefined) updateData.cpf = data.cpf ?? null;
    if (data.categoria !== undefined) updateData.categoria = data.categoria;
    if (data.responsavelId !== undefined) updateData.responsavelId = data.responsavelId; // obrigatório → sem null
    if (data.status !== undefined) updateData.status = data.status;
    if (data.observacoes !== undefined) updateData.observacoes = data.observacoes ?? null;

    return prisma.alunoFutebol.update({
      where: { id: alunoId },
      data: updateData,
    });
  }

  async delete(escolinhaId: string, alunoId: string) {
    await this.findById(escolinhaId, alunoId);

    await prisma.alunoFutebol.delete({
      where: { id: alunoId },
    });

    return { message: 'Aluno excluído com sucesso' };
  }
}