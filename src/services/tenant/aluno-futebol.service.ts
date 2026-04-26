import bcrypt from 'bcrypt';
import { CreateAlunoFutebolDto, UpdateAlunoFutebolDto } from '../../dto/tenant/aluno-futebol.dto';
import { prisma } from '../../server';
import cloudinary from '../../config/cloudinary';
import { AppError } from '../../utils/AppError';

export class AlunoFutebolService {
async create(
  escolinhaId: string, 
  data: any, 
  fotoFile?: Express.Multer.File
) {
  console.log('[SERVICE CREATE ALUNO] Iniciando...');

  const emailLower = data.email.toLowerCase().trim();

  // Verifica duplicidade de email
  const existingUser = await prisma.user.findUnique({
    where: { email: emailLower },
  });

  if (existingUser) {
    throw new AppError('E-mail já cadastrado',409);
  }

  let fotoUrl: string | null = null;

  // ====================== UPLOAD PARA CLOUDINARY ======================
  if (fotoFile) {
    try {
      console.log('[SERVICE] Iniciando upload da foto para Cloudinary...');

      const uploadResult = await cloudinary.uploader.upload(
        `data:${fotoFile.mimetype};base64,${fotoFile.buffer.toString('base64')}`,
        {
          folder: `edupay/${escolinhaId}/aluno-futebol`,
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

  // ====================== CRIAÇÃO DO ALUNO ======================
  const senhaTemporaria = data.password || Math.random().toString(36).slice(-12) + '!@#';
  const hashedPassword = await bcrypt.hash(senhaTemporaria, 10);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: emailLower,
        password: hashedPassword,
        name: data.nome,
        role: 'ALUNO_FUTEBOL',
        escolinha: { connect: { id: escolinhaId } },
      },
    });

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
        userId: user.id,
        fotoUrl,                    // ← Aqui salva a URL da imagem
      },
    });

    await tx.user.update({
      where: { id: user.id },
      data: { alunoFutebolId: aluno.id },
    });

    return { aluno, senhaTemporaria };
  });

  console.log('[SERVICE] Aluno criado com sucesso. fotoUrl:', fotoUrl || 'Nenhuma');
  return result;
}

  //LISTAR ALUNOS
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
      throw new AppError("Aluno não encontrado",409);
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

// Rota de usuario verificar seus trinos por mes

async getTreinosMes(escolinhaId: string, alunoId: string, mes: string) {
  try {
    const [ano, mesNum] = mes.split('-').map(Number);
    const dataInicio = new Date(ano, mesNum - 1, 1);
    const dataFim = new Date(ano, mesNum, 0); // último dia do mês

    // Busca o aluno para pegar sua categoria
    const aluno = await prisma.alunoFutebol.findUnique({
      where: { id: alunoId },
      select: { categoria: true }
    });

    if (!aluno) throw new AppError('Aluno não encontrado', 404);

    // Busca treinos recorrentes da mesma categoria
    const treinosRecorrentes = await prisma.treinoRecorrente.findMany({
      where: {
        escolinhaId,
        categoria: aluno.categoria,
        ativo: true,
      },
      include: {
        funcionarioTreinador: {
          select: { nome: true }
        }
      }
    });

    const treinosGerados = [];

    for (let d = new Date(dataInicio); d <= dataFim; d.setDate(d.getDate() + 1)) {
      const diaSemana = d.getDay();

      const treinoDoDia = treinosRecorrentes.find(t => t.diasSemana.includes(diaSemana));

      if (treinoDoDia) {
        treinosGerados.push({
          id: `treino-${d.toISOString()}`,
          data: d.toISOString().split('T')[0],
          nome: treinoDoDia.nome,
          horaInicio: treinoDoDia.horaInicio,
          horaFim: treinoDoDia.horaFim,
          local: treinoDoDia.local,
          treinador: treinoDoDia.funcionarioTreinador?.nome || 'Treinador',
          status: 'confirmado'
        });
      }
    }

    return treinosGerados;
  } catch (error) {
    console.error("Erro getTreinosMes:", error);
    throw error;
  }
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
