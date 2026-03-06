import bcrypt from 'bcrypt';
import { CreateAlunoFutebolDto, UpdateAlunoFutebolDto } from '../../dto/tenant/aluno-futebol.dto';
import { prisma } from '../../server';

export class AlunoFutebolService {
async create(escolinhaId: string, data: CreateAlunoFutebolDto) {
  console.log('[SERVICE CREATE ALUNO FUTEBOL] Dados recebidos:', JSON.stringify(data, null, 2));

  const emailLower = data.email.toLowerCase().trim();

  // Verifica duplicidade de email
  const existingUser = await prisma.user.findUnique({
    where: { email: emailLower },
  });

  if (existingUser) {
    throw new Error('E-mail já cadastrado');
  }

  // Gera senha temporária (se não veio no payload)
  const senhaTemporaria = data.password || Math.random().toString(36).slice(-12) + '!@#';
  const hashedPassword = await bcrypt.hash(senhaTemporaria, 10);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Cria o User
    const user = await tx.user.create({
      data: {
        email: emailLower,
        password: hashedPassword,
        name: data.nome,
        role: 'ALUNO_FUTEBOL',
        escolinha: { connect: { id: escolinhaId } },
      },
    });

    // 2. Cria o AlunoFutebol e vincula o userId
    const aluno = await tx.alunoFutebol.create({
      data: {
        nome: data.nome,
        dataNascimento: new Date(data.dataNascimento.split('/').reverse().join('-')),
        telefone: data.telefone,
        cpf: data.cpf,
        categoria: data.categoria,
        responsavelId: data.responsavelId || null,
        email: emailLower,
        status: 'ATIVO',
        observacoes: data.observacoes,
        escolinhaId,
        userId: user.id,  // Vincula aluno → user
      },
    });

    // 3. Completa a relação bidirecional: vincula alunoFutebolId no User
    await tx.user.update({
      where: { id: user.id },
      data: {
        alunoFutebolId: aluno.id,
      },
    });

    return { aluno, senhaTemporaria };
  });

  return result;
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
  console.log('[SERVICE UPDATE ALUNO FUTEBOL] Iniciando atualização para ID:', id);
  console.log('[SERVICE UPDATE ALUNO FUTEBOL] Dados recebidos:', JSON.stringify(data, null, 2));

  // Busca o aluno com user incluído
  const aluno = await prisma.alunoFutebol.findFirst({
    where: { id, escolinhaId },
    include: { user: true },
  });

  if (!aluno) {
    throw new Error('Aluno não encontrado ou não pertence à escolinha');
  }

  // Prepara os dados para atualizar no AlunoFutebol
  const updateAlunoData: any = {};

  if (data.nome !== undefined) updateAlunoData.nome = data.nome.trim();
  if (data.dataNascimento !== undefined) {
    updateAlunoData.dataNascimento = new Date(data.dataNascimento);
  }
  if (data.telefone !== undefined) updateAlunoData.telefone = data.telefone.trim() || null;
  if (data.cpf !== undefined) updateAlunoData.cpf = data.cpf || null;
  if (data.categoria !== undefined) updateAlunoData.categoria = data.categoria.trim();
  if (data.responsavelId !== undefined) updateAlunoData.responsavelId = data.responsavelId || null;
  if (data.observacoes !== undefined) updateAlunoData.observacoes = data.observacoes?.trim() || null;
  if (data.status !== undefined) updateAlunoData.status = data.status;

  // Se enviou novo e-mail, valida duplicidade e atualiza tanto no aluno quanto no user
  if (data.email && data.email !== aluno.email) {
    const emailLower = data.email.toLowerCase().trim();

    const emailExists = await prisma.user.findFirst({
      where: {
        email: emailLower,
        id: { not: aluno.userId! },
      },
    });

    if (emailExists) {
      throw new Error('E-mail já em uso por outro usuário');
    }

    updateAlunoData.email = emailLower;

    if (aluno.userId) {
      await prisma.user.update({
        where: { id: aluno.userId },
        data: { email: emailLower },
      });
      console.log('[SERVICE UPDATE] E-mail atualizado no User:', emailLower);
    }
  }

  // Se enviou nova senha, atualiza apenas no User
  if (data.password && aluno.userId) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    await prisma.user.update({
      where: { id: aluno.userId },
      data: { password: hashedPassword },
    });

    console.log('[SERVICE UPDATE] Senha redefinida no User ID:', aluno.userId);
  } else if (data.password && !aluno.userId) {
    throw new Error('Este aluno não possui login associado para alterar a senha');
  }

  // Atualiza o aluno
  const alunoAtualizado = await prisma.alunoFutebol.update({
    where: { id },
    data: updateAlunoData,
  });

  console.log('[SERVICE UPDATE ALUNO FUTEBOL] Aluno atualizado com sucesso - ID:', id);

  return alunoAtualizado;
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
