// src/services/tenant/treinador.service.ts
import { prisma } from '../../server';
import bcrypt from 'bcrypt';
import { CreateTreinadorDto, UpdateTreinadorDto } from '../../dto/tenant/treinador.dto';
import cloudinary from '../../config/cloudinary';
import { AppError } from '../../utils/AppError';

export class TreinadorService {

  async create(escolinhaId: string, data: any, fotoFile?: Express.Multer.File) {
    console.log('[SERVICE CREATE TREINADOR] Dados recebidos:', JSON.stringify(data, null, 2));

    if (!data.email || !data.nome) {
      throw new AppError('Nome e E-mail são obrigatórios', 400);
    }

    const emailLower = data.email.toLowerCase().trim();

    // Verifica duplicidade
    const existingUser = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (existingUser) {
      throw new AppError('E-mail já cadastrado', 409);
    }

    let fotoUrl: string | null = null;

    // Upload da foto (opcional)
    if (fotoFile) {
      try {
        const uploadResult = await cloudinary.uploader.upload(
          `data:${fotoFile.mimetype};base64,${fotoFile.buffer.toString('base64')}`,
          {
            folder: `edupay/${escolinhaId}/treinador`,
            transformation: [{ width: 800, height: 800, crop: 'limit' }],
          }
        );
        fotoUrl = uploadResult.secure_url;
      } catch (err) {
        console.error('Erro upload foto:', err);
      }
    }

    const senhaTemporaria = data.password || Math.random().toString(36).slice(-12) + '!@#';
    const hashedPassword = await bcrypt.hash(senhaTemporaria, 10);

    // Criação sem transação (mais estável para debug)
    const user = await prisma.user.create({
      data: {
        email: emailLower,
        password: hashedPassword,
        name: data.nome,
        role: 'TREINADOR',
        escolinhaId,
      },
    });

    const treinador = await prisma.treinador.create({
      data: {
        nome: data.nome,
        email: emailLower,
        telefone: data.telefone ?? null,
        dataNascimento: data.dataNascimento ? new Date(data.dataNascimento) : null,
        observacoes: data.observacoes ?? null,
        fotoUrl,
        escolinhaId,
        userId: user.id,
      },
    });

    // Vincula o user ao treinador
    await prisma.user.update({
      where: { id: user.id },
      data: { treinadorId: treinador.id },
    });

    console.log('[SERVICE] Treinador criado com sucesso - ID:', treinador.id);

    return { treinador, senhaTemporaria };
  }

  async list(escolinhaId: string) {
    return prisma.treinador.findMany({
      where: { escolinhaId },
      orderBy: { nome: 'asc' },
      include: { user: true },
    });
  }

  async findById(escolinhaId: string, id: string) {
    const treinador = await prisma.treinador.findFirst({
      where: { id, escolinhaId },
      include: { user: true, escolinha: true },
    });

    if (!treinador) throw new AppError('Treinador não encontrado', 404);

    return treinador;
  }

  async update(escolinhaId: string, id: string, data: UpdateTreinadorDto) {
    const treinador = await this.findById(escolinhaId, id);

    const updateData: any = {};

    if (data.nome !== undefined) updateData.nome = data.nome.trim();
    if (data.telefone !== undefined) updateData.telefone = data.telefone?.trim() || null;
    if (data.observacoes !== undefined) updateData.observacoes = data.observacoes?.trim() || null;
    if (data.dataNascimento !== undefined) updateData.dataNascimento = data.dataNascimento ? new Date(data.dataNascimento) : null;

    return prisma.treinador.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(escolinhaId: string, id: string) {
    await this.findById(escolinhaId, id);
    await prisma.treinador.delete({ where: { id } });
    return { message: 'Treinador excluído com sucesso' };
  }
}