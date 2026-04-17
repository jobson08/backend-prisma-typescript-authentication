// src/services/tenant/funcionario.service.ts
import { prisma } from '../../server';
import { CreateFuncionarioDto, UpdateFuncionarioDto } from '../../dto/tenant/funcionario.dto';
import bcrypt from 'bcrypt';
import cloudinary from '../../config/cloudinary';
import { AppError } from '../../utils/AppError';

export class FuncionarioService {
async create(escolinhaId: string, data: any, fotoFile?: Express.Multer.File) {
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

  let fotoUrl: string | null = null;
// ====================== UPLOAD PARA CLOUDINARY ======================
  if (fotoFile) {
    try {
      console.log('[SERVICE] Iniciando upload da foto para Cloudinary...');

      const uploadResult = await cloudinary.uploader.upload(
        `data:${fotoFile.mimetype};base64,${fotoFile.buffer.toString('base64')}`,
        {
          folder: `edupay/${escolinhaId}/funcionarios`,
          transformation: [{ width: 800, height: 800, crop: 'limit' }],
          resource_type: "image",
        }
      );

      fotoUrl = uploadResult.secure_url;
      console.log('[SERVICE] ✅ Foto enviada com sucesso para Cloudinary:', fotoUrl);
    } catch (uploadError: any) {
      console.error('[SERVICE] ❌ Erro ao fazer upload para Cloudinary:', uploadError.message || uploadError);
      // Não interrompe o cadastro se o upload falhar
    }
  } else {
    console.log('[SERVICE] Nenhuma foto foi enviada');
  }

   // ====================== CRIAÇÃO DO FUNCIONARIO ======================
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
    cpf: data.cpf,                    // agora vai existir
    cargo: data.cargo,
    salario: data.salario,            // já está como number (2000)
    telefone: data.telefone,
    observacoes: data.observacoes,
    email: emailLower,
    escolinhaId,
    userId: user.id,
    fotoUrl,
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
    if (data.cpf !== undefined) updateData.cpf = data.cpf.replace(/\D/g, '') || null;
    if (data.telefone !== undefined) updateData.telefone = data.telefone?.trim() || null;
    if (data.cargo !== undefined) updateData.cargo = data.cargo;
    if (data.salario !== undefined) updateData.salario = data.salario;
    if (data.observacoes !== undefined) updateData.observacoes = data.observacoes?.trim() || null;
    //if (data.fotoUrl !== undefined) updateData.fotoUrl = data.fotoUrl?.trim() || null;

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

    if (!funcionario) throw new AppError('Funcionário não encontrado', 404);

    return prisma.$transaction(async (tx) => {
      // 1. Deletar User primeiro (lado da FK)
      if (funcionario.userId) {
        await tx.user.delete({ where: { id: funcionario.userId } });
      }

      // 2. Depois deletar Funcionário
      await tx.funcionario.delete({ where: { id } });

      // 3. (Opcional) Deletar foto do Cloudinary
      if (funcionario.fotoUrl) {
        const publicId = funcionario.fotoUrl.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId).catch(() => {});
      }
    });
  }
}