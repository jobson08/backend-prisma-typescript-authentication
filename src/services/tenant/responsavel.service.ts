// src/services/responsavel.service.ts
import { prisma } from '../../server';
import bcrypt from 'bcrypt';
import { CreateResponsavelDto, UpdateResponsavelDto } from '../../dto/tenant/responsavel.dto';
import cloudinary from '../../config/cloudinary';
import { AppError } from '../../utils/AppError';
export class ResponsavelService {
async create(escolinhaId: string, data: any, fotoFile?: Express.Multer.File) {
  console.log('[SERVICE CREATE RESPONSAVEL] Dados recebidos:', JSON.stringify(data, null, 2));
  console.log('[SERVICE CREATE RESPONSAVEL] escolinhaId:', escolinhaId);

  const emailLower = data.email.toLowerCase().trim();

  // Verifica duplicidade de email
  const existingUser = await prisma.user.findUnique({
    where: { email: emailLower },
  });

  if (existingUser) {
    console.log('[SERVICE CREATE RESPONSAVEL] Email duplicado encontrado');
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
          folder: `edupay/${escolinhaId}/responsavel`,
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
  // Gera senha temporária (automática se não vier no payload)
  const senhaTemporaria = data.password || Math.random().toString(36).slice(-12) + '!@#';
  const hashedPassword = await bcrypt.hash(senhaTemporaria, 10);

  console.log('[SERVICE CREATE RESPONSAVEL] Senha temporária gerada');

  const result = await prisma.$transaction(async (tx) => {
    console.log('[SERVICE CREATE RESPONSAVEL] Criando User...');

    const user = await tx.user.create({
      data: {
        email: emailLower,
        password: hashedPassword,
        name: data.nome,
        role: 'RESPONSAVEL',
        escolinha: { connect: { id: escolinhaId } },
      },
    });

    console.log('[SERVICE CREATE RESPONSAVEL] User criado - ID:', user.id);

    console.log('[SERVICE CREATE RESPONSAVEL] Criando Responsavel...');

    const responsavel = await tx.responsavel.create({
      data: {
        nome: data.nome,
        cpf: data.cpf ?? null,
        email: data.email ?? null,
        telefone: data.telefone ?? null,
        fotoUrl,// se quiser suporte a foto, adicione no DTO
        observacoes: data.observacoes ?? null,
        escolinhaId,
        userId: user.id,  // Vincula responsavel → user
      },
    });

    console.log('[SERVICE CREATE RESPONSAVEL] Responsavel criado - ID:', responsavel.id);

    // Completa a relação bidirecional
    await tx.user.update({
      where: { id: user.id },
      data: {
        responsavelId: responsavel.id,  // ← CAMPO CORRETO (responsavelId, não alunoCrossfitId)
      },
    });

    console.log('[SERVICE CREATE RESPONSAVEL] Relação bidirecional completa: responsavelId atualizado no User');

    return { responsavel, senhaTemporaria };
  });

  console.log('[SERVICE CREATE RESPONSAVEL] Criação concluída com sucesso');
  return result;
}

//---------------------------------listar--------------------------------

  async list(escolinhaId: string) {
    return prisma.responsavel.findMany({
      where: { escolinhaId },
      orderBy: { nome: 'asc' },
      include: { filhos: true, user: true }, // inclui filhos (alunos) e login
    });
  }
//---------------------------------listar po Id--------------------------------
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

//---------------------------------Editar-------------------------------
// src/services/tenant/responsavel.service.ts
async update(escolinhaId: string, id: string, data: UpdateResponsavelDto) {
  console.log('[SERVICE UPDATE RESPONSAVEL] Iniciando atualização - ID:', id);


  // Busca com user incluído
  const responsavel = await prisma.responsavel.findFirst({
    where: { id, escolinhaId },
    include: { user: true },
  });

  if (!responsavel) {
    throw new Error('Responsável não encontrado ou não pertence à escolinha');
  }

  // Prepara atualização do responsável
  const updateData: any = {};

  if (data.nome !== undefined) updateData.nome = data.nome.trim();
  if (data.cpf !== undefined) updateData.cpf = data.cpf?.replace(/\D/g, '') || null;
  if (data.telefone !== undefined) updateData.telefone = data.telefone?.replace(/\D/g, '') || null;
  if (data.observacoes !== undefined) updateData.observacoes = data.observacoes?.trim() || null;
  //if (data.fotoUrl !== undefined) updateData.fotoUrl = data.fotoUrl?.trim() || null;

  // Atualização de email
  let emailAtualizado = false;
  if (data.email && data.email.toLowerCase().trim() !== responsavel.email) {
    const emailLower = data.email.toLowerCase().trim();

    // Verifica duplicidade no User
    const existingUser = await prisma.user.findFirst({
      where: {
        email: emailLower,
        id: { not: responsavel.userId! },
      },
    });

    if (existingUser) {
      throw new Error('E-mail já em uso por outro usuário');
    }

    updateData.email = emailLower;
    emailAtualizado = true;
  }

  // Atualização de senha
  let senhaAtualizada = false;
  if (data.password) {
    if (!responsavel.userId || !responsavel.user) {
      throw new Error('Este responsável não possui login associado para alterar a senha');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    await prisma.user.update({
      where: { id: responsavel.userId },
      data: { password: hashedPassword },
    });

    senhaAtualizada = true;
    console.log('[SERVICE UPDATE RESPONSAVEL] Senha atualizada no User ID:', responsavel.userId);
  }

  // Atualiza o responsável
  const responsavelAtualizado = await prisma.responsavel.update({
    where: { id },
    data: updateData,
  });

  // Se mudou email, atualiza no User
  if (emailAtualizado && responsavel.userId) {
    await prisma.user.update({
      where: { id: responsavel.userId },
      data: { email: data.email!.toLowerCase().trim() },
    });
    console.log('[SERVICE UPDATE RESPONSAVEL] E-mail atualizado no User:', data.email);
  }

  console.log('[SERVICE UPDATE RESPONSAVEL] Responsável atualizado com sucesso - ID:', id);

  return responsavelAtualizado;
}

  //-----------------------Atualização da senha (se enviada)--------------------------------

  //---------------------------------Deletar--------------------------------

  async delete(escolinhaId: string, responsavelId: string) {
    await this.findById(escolinhaId, responsavelId); // valida

    await prisma.responsavel.delete({
      where: { id: responsavelId },
    });

    return { message: 'Responsável excluído com sucesso' };
  }
}