// src/services/tenant/aluno-crossfit.service.ts
import bcrypt from 'bcrypt';
import { prisma } from '../../server';
import { CreateAlunoCrossfitDto, CrossfitInscricaoDTO, CrossfitTurmaDTO, UpdateAlunoCrossfitDto, UpdateCrossfitInscricaoDTO } from '../../dto/tenant/aluno-crossfit.dto';
import cloudinary from '../../config/cloudinary';


export class AlunoCrossfitService {
 async create(escolinhaId: string,  data: any, fotoFile?: Express.Multer.File) {
    console.log('[SERVICE CREATE ALUNO CROSSFIT] Dados recebidos:', JSON.stringify(data, null, 2));
    console.log('[SERVICE CREATE ALUNO CROSSFIT] escolinhaId:', escolinhaId);

    const emailLower = data.email.toLowerCase().trim();

    // Verifica duplicidade de email
    const existingUser = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (existingUser) {
      console.log('[SERVICE CREATE ALUNO CROSSFIT] Email duplicado encontrado');
      throw new Error('E-mail já cadastrado');
    }

     let fotoUrl: string | null = null;
// ====================== UPLOAD PARA CLOUDINARY ======================
  if (fotoFile) {
    try {
      console.log('[SERVICE] Iniciando upload da foto para Cloudinary...');

      const uploadResult = await cloudinary.uploader.upload(
        `data:${fotoFile.mimetype};base64,${fotoFile.buffer.toString('base64')}`,
        {
          folder: `edupay/${escolinhaId}/aluno-crossfit`,
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
    // Gera senha temporária (automática se não vier no payload)
    const senhaTemporaria = data.password || Math.random().toString(36).slice(-12) + '!@#';
    const hashedPassword = await bcrypt.hash(senhaTemporaria, 10);

    console.log('[SERVICE CREATE ALUNO CROSSFIT] Senha temporária gerada');

    const result = await prisma.$transaction(async (tx) => {
      console.log('[SERVICE CREATE ALUNO CROSSFIT] Criando User...');

      const user = await tx.user.create({
        data: {
          email: emailLower,
          password: hashedPassword,
          name: data.nome,
          role: 'ALUNO_CROSSFIT',  // role específico
          escolinha: { connect: { id: escolinhaId } },
        },
      });

      console.log('[SERVICE CREATE ALUNO CROSSFIT] User criado - ID:', user.id);

      console.log('[SERVICE CREATE ALUNO CROSSFIT] Criando AlunoCrossfit...');

      const aluno = await tx.alunoCrossfit.create({
        data: {
          nome: data.nome,
          dataNascimento: new Date(data.dataNascimento.split('/').reverse().join('-')),
          telefone: data.telefone,
          cpf: data.cpf,
         // nivel: data.nivel,  // campo específico do crossfit
          email: emailLower,
          status: 'ATIVO',
          observacoes: data.observacoes,
          escolinhaId,
          userId: user.id,  // Vincula aluno → user
          fotoUrl,       
        },
      });

      console.log('[SERVICE CREATE ALUNO CROSSFIT] Aluno criado - ID:', aluno.id);

      // Completa a relação bidirecional
      await tx.user.update({
        where: { id: user.id },
        data: { alunoCrossfitId: aluno.id },
      });

      console.log('[SERVICE CREATE ALUNO CROSSFIT] Relação bidirecional completa: alunoCrossfitId atualizado no User');

      return { aluno, senhaTemporaria };
    });

    console.log('[SERVICE CREATE ALUNO CROSSFIT] Criação concluída com sucesso');
    return result;
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

  async update(escolinhaId: string, id: string, data: UpdateAlunoCrossfitDto) {
  console.log('[SERVICE UPDATE ALUNO CROSSFIT] Iniciando atualização - ID:', id);
  console.log('[SERVICE UPDATE ALUNO CROSSFIT] Dados recebidos:', JSON.stringify(data, null, 2));

  // Busca aluno com user incluído (para verificar login)
  const aluno = await prisma.alunoCrossfit.findFirst({
    where: { id, escolinhaId },
    include: { user: true },
  });

  if (!aluno) {
    throw new Error('Aluno de CrossFit não encontrado ou não pertence à escolinha');
  }



  // Se alterar email ou CPF, verifica unicidade em AlunoCrossfit
  if (data.email || data.cpf) {
    const existingAluno = await prisma.alunoCrossfit.findFirst({
      where: {
        OR: [
          ...(data.email ? [{ email: data.email.toLowerCase().trim() }] : []),
          ...(data.cpf ? [{ cpf: data.cpf.replace(/\D/g, '') }] : []),
        ],
        escolinhaId,
        id: { not: id },
      },
    });

    if (existingAluno) {
      throw new Error('E-mail ou CPF já cadastrado nesta escolinha');
    }
  }

  // Prepara dados para atualizar AlunoCrossfit
  const updateAlunoData: any = {};

  if (data.nome !== undefined) updateAlunoData.nome = data.nome.trim();
  if (data.dataNascimento !== undefined) {
    const date = new Date(data.dataNascimento);
    if (isNaN(date.getTime())) throw new Error('Data de nascimento inválida');
    updateAlunoData.dataNascimento = date;
  }
  if (data.telefone !== undefined) updateAlunoData.telefone = data.telefone.replace(/\D/g, '') || null;
  if (data.cpf !== undefined) updateAlunoData.cpf = data.cpf.replace(/\D/g, '') || null;
  if (data.observacoes !== undefined) updateAlunoData.observacoes = data.observacoes.trim() || null;
  if (data.status !== undefined) updateAlunoData.status = data.status;

  // Atualização do email (aluno + user)
  let emailAtualizado = false;
  if (data.email && data.email.toLowerCase().trim() !== aluno.email) {
    const emailLower = data.email.toLowerCase().trim();

    // Verifica duplicidade no User (mais importante)
    const existingUser = await prisma.user.findFirst({
      where: {
        email: emailLower,
        id: { not: aluno.userId! },
      },
    });

    if (existingUser) {
      throw new Error('E-mail já em uso por outro usuário');
    }

    updateAlunoData.email = emailLower;
    emailAtualizado = true;
  }

  // Atualização da senha (se enviada)
  let senhaAtualizada = false;
   if (data.password && aluno.userId) {
   
    const hashedPassword = await bcrypt.hash(data.password, 10);

    await prisma.user.update({
      where: { id: aluno.userId },
      data: { password: hashedPassword },
    });

    senhaAtualizada = true;
    console.log('[SERVICE UPDATE ALUNO CROSSFIT] Senha atualizada no User ID:', aluno.userId);
  }

  // Atualiza o aluno
  const alunoAtualizado = await prisma.alunoCrossfit.update({
    where: { id },
    data: updateAlunoData,
  });

  // Se mudou email, atualiza também no User
  if (emailAtualizado && aluno.userId) {
    await prisma.user.update({
      where: { id: aluno.userId },
      data: { email: data.email!.toLowerCase().trim() },
    });
    console.log('[SERVICE UPDATE ALUNO CROSSFIT] E-mail atualizado no User:', data.email);
  }

  console.log('[SERVICE UPDATE ALUNO CROSSFIT] Aluno atualizado com sucesso - ID:', id);

  return alunoAtualizado;
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
//====================================Service criação de turmas e relacionamento com o aluno crossfit==============
// Criar turma de CrossFit
async criarTurma(escolinhaId: string, data: CrossfitTurmaDTO) {
  console.log('[SERVICE] Criando turma CrossFit:', { escolinhaId, ...data });

  // Verifica se professor existe (opcional, mas evita 500)
  const professorExiste = await prisma.funcionario.findUnique({
    where: { id: data.professorId },
  });

  if (!professorExiste) {
    throw new Error("Professor não encontrado");
  }

  return prisma.aulaCrossfit.create({
    data: {
      ...data,
      escolinhaId, // ← sempre adicionado aqui
    },
  });
}

  // Atualizar turma
  async atualizarTurma(id: string, escolinhaId: string, data: Partial<CrossfitTurmaDTO>) {
    console.log('[SERVICE] Atualizando turma CrossFit:', { id, escolinhaId, ...data });

    return prisma.aulaCrossfit.update({
      where: { id, escolinhaId },
      data,
    });
  }

  // Listar todas as turmas da escolinha
  async listarTurmas(escolinhaId: string) {
    return prisma.aulaCrossfit.findMany({
      where: { escolinhaId },
      include: {
        professor: { select: { nome: true, id: true } },
        _count: { select: { inscricoes: true } }, // para saber quantos alunos inscritos
      },
      orderBy: { createdAt: 'desc' },
    });
  }
//excluir Turmas
  async excluirTurma(id: string, escolinhaId: string) {
  console.log('[SERVICE] Excluindo turma CrossFit:', { id, escolinhaId });

  // Verifica se a turma existe e pertence à escolinha
  const turma = await prisma.aulaCrossfit.findFirst({
    where: { id, escolinhaId },
  });

  if (!turma) {
    throw new Error("Turma não encontrada ou não pertence à escolinha");
  }

  // Verifica se há inscrições ativas (opcional - para evitar exclusão com alunos inscritos)
  const inscricoes = await prisma.aulaCrossfitAluno.count({
    where: { aulaCrossfitId: id },
  });

  if (inscricoes > 0) {
    throw new Error("Não é possível excluir turma com alunos inscritos. Transfira ou cancele as inscrições primeiro.");
  }

  return prisma.aulaCrossfit.delete({
    where: { id },
  });
}

  // Inscrever aluno em uma turma
  async inscreverAluno(data: CrossfitInscricaoDTO) {
    console.log('[SERVICE] Inscrevendo aluno em turma CrossFit:', data);

    // Verifica duplicata
    const jaInscrito = await prisma.aulaCrossfitAluno.findFirst({
      where: {
        aulaCrossfitId: data.aulaCrossfitId,
        alunoId: data.alunoId,
      },
    });

    if (jaInscrito) {
      throw new Error("Este aluno já está inscrito nesta turma");
    }

    // Verifica vagas disponíveis
    const turma = await prisma.aulaCrossfit.findUnique({
      where: { id: data.aulaCrossfitId },
      select: { vagasMax: true, _count: { select: { inscricoes: true } } },
    });

    if (!turma) throw new Error("Turma não encontrada");
    if (turma._count.inscricoes >= turma.vagasMax) {
      throw new Error("Turma lotada");
    }

    return prisma.aulaCrossfitAluno.create({
      data: {
        aulaCrossfitId: data.aulaCrossfitId,
        alunoId: data.alunoId,
      //  dataInicio: data.dataInicio ? new Date(data.dataInicio) : null,
        observacao: data.observacao,
      },
    });
  }

  // Atualizar inscrição (ex: mudar status, adicionar observação)
  async atualizarInscricao(id: string, data: UpdateCrossfitInscricaoDTO) {
    return prisma.aulaCrossfitAluno.update({
      where: { id },
      data: {
        dataInicio: data.dataInicio ? new Date(data.dataInicio) : undefined,
        status: data.status,
        observacao: data.observacao,
      },
    });
  }

  // Excluir inscrição
  async excluirInscricao(id: string) {
    return prisma.aulaCrossfitAluno.delete({ where: { id } });
  }

  // Listar alunos inscritos em uma turma
  async listarInscricoes(turmaId: string) {
    return prisma.aulaCrossfitAluno.findMany({
      where: { aulaCrossfitId: turmaId },
      include: {
        aluno: { select: { nome: true, id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

}


export const alunoCrossfitService = new AlunoCrossfitService();