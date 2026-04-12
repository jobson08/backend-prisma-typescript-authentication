// src/services/tenant/funcionario.service.ts
import { prisma } from '../../server';
import { CreateFuncionarioDto, UpdateFuncionarioDto } from '../../dto/tenant/funcionario.dto';
import bcrypt from 'bcrypt';
import { AppError } from '../../utils/AppError';

export class FuncionarioService {
async create(escolinhaId: string, data: CreateFuncionarioDto) {
  console.log('[SERVICE CREATE FUNCIONARIO] Dados recebidos:', JSON.stringify(data, null, 2));
  console.log('[SERVICE CREATE FUNCIONARIO] escolinhaId:', escolinhaId);

  const emailLower = data.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({
    where: { email: emailLower },
  });

  if (existing) {
      console.log('[SERVICE CREATE FUNCIONARIO] Email duplicado encontrado');
    throw new AppError('E-mail já cadastrado', 409);
  }

  const senhaTemporaria = data.password || Math.random().toString(36).slice(-12) + '!@#';
  const hashedPassword = await bcrypt.hash(senhaTemporaria, 10);

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
        userId: user.id,  // ← já tem isso, correto
      },
    });

    // ← ESSA LINHA É A QUE FALTAVA (completa o lado inverso)
    await tx.user.update({
      where: { id: user.id },
      data: { funcionarioId: funcionario.id },
    });

    return { funcionario, senhaTemporaria };
  });

  return result;
}
//------------------------------------------Listar funcionarios---------------------------------
  async list(escolinhaId: string) {
    return prisma.funcionario.findMany({
      where: { escolinhaId },
      orderBy: { nome: 'asc' },
    });
  }
//------------------------------------------Listar funcionario por Id---------------------------------
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

  //------------------------------------------atualizar funcionarios---------------------------------

async update(escolinhaId: string, id: string, data: UpdateFuncionarioDto) {
    console.log('[SERVICE UPDATE FUNCIONARIO] Iniciando atualização - ID:', id);
    console.log('[SERVICE UPDATE FUNCIONARIO] Dados recebidos:', JSON.stringify(data, null, 2));

    // Busca com user incluído
    const funcionario = await prisma.funcionario.findFirst({
      where: { id, escolinhaId },
      include: { user: true },
    });

    if (!funcionario) {
      throw new Error('Funcionário não encontrado ou não pertence à escolinha');
    }

    const updateData: any = {};

    if (data.nome !== undefined) updateData.nome = data.nome.trim();
    if (data.telefone !== undefined) updateData.telefone = data.telefone?.trim() || null;
    if (data.cargo !== undefined) updateData.cargo = data.cargo;
    if (data.salario !== undefined) updateData.salario = data.salario;
    if (data.observacoes !== undefined) updateData.observacoes = data.observacoes?.trim() || null;
    if (data.fotoUrl !== undefined) updateData.fotoUrl = data.fotoUrl?.trim() || null;

    // Atualização de email
    let emailAtualizado = false;
    if (data.email && data.email.toLowerCase().trim() !== funcionario.email) {
      const emailLower = data.email.toLowerCase().trim();

      const existingUser = await prisma.user.findFirst({
        where: {
          email: emailLower,
          id: { not: funcionario.userId! },
        },
      });

      if (existingUser) {
        throw new Error('E-mail já em uso por outro usuário');
      }

      updateData.email = emailLower;
      emailAtualizado = true;
    }

    // Atualização de senha
    if (data.password) {
      if (!funcionario.userId || !funcionario.user) {
        throw new Error('Este funcionário não possui login associado para alterar a senha');
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      await prisma.user.update({
        where: { id: funcionario.userId },
        data: { password: hashedPassword },
      });

      console.log('[SERVICE UPDATE FUNCIONARIO] Senha atualizada no User ID:', funcionario.userId);
    }

    // Atualiza o funcionário
    const funcionarioAtualizado = await prisma.funcionario.update({
      where: { id },
      data: updateData,
    });

    // Se mudou email, atualiza no User
    if (emailAtualizado && funcionario.userId) {
      await prisma.user.update({
        where: { id: funcionario.userId },
        data: { email: data.email!.toLowerCase().trim() },
      });
      console.log('[SERVICE UPDATE FUNCIONARIO] E-mail atualizado no User:', data.email);
    }

    console.log('[SERVICE UPDATE FUNCIONARIO] Funcionário atualizado com sucesso - ID:', id);

    return funcionarioAtualizado;
  }
//----------------------------------------------Deletar funcionario---------------------------------

  async delete(escolinhaId: string, id: string) {
    const funcionario = await prisma.funcionario.findFirst({
      where: { id, escolinhaId },
    });

    if (!funcionario) {
      throw new Error('Funcionário não encontrado');
    }

    await prisma.funcionario.delete({ where: { id } });

    // Opcional: remover User associado (se desejar)
     if (funcionario.userId) {
       await prisma.user.delete({ where: { id: funcionario.userId } });
     }
  }
}