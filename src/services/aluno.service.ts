// src/services/aluno.service.ts
import { prisma } from '../config/database';
import { CreateAlunoDto } from '../dto/create-aluno.dto';
import bcrypt from 'bcrypt';

export const alunoService = {
    //cadastrar aluno
  async create(dto: CreateAlunoDto, tenantId: string) {
    // Verifica se o responsável pertence ao mesmo tenant
    const responsavel = await prisma.responsavel.findUnique({
      where: { id: dto.responsavelId },
      select: { tenantId: true },
    });

    if (!responsavel || responsavel.tenantId !== tenantId) {
      throw new Error('Responsável não encontrado ou não pertence a este tenant');
    }

    return await prisma.aluno.create({
      data: {
        ...dto,
        birthDate: new Date(dto.birthDate),
        tenantId,
      },
      select: {
        id: true,
        name: true,
        birthDate: true,
        phone: true,
        status: true,
        observations: true,
        createdAt: true,
        responsavel: {
          select: { id: true, name: true, phone: true, relacionamento: true },
        },
      },
    });
  },

  //cria usuario aluno
  async criarUsuarioParaAluno(
  alunoId: string,
  tenantId: string,
  data: { email: string; password: string; sendEmail?: boolean }
) {
  // 1. Busca aluno + verifica se já tem usuário
  const aluno = await prisma.aluno.findUnique({
    where: { id: alunoId },
    include: { usuario: true },
  });

  if (!aluno) throw new Error('Aluno não encontrado');
  if (aluno.tenantId !== tenantId) throw new Error('Acesso negado');
  if (aluno.usuario) throw new Error('Este aluno já possui login');

  // 2. Verifica email duplicado
  const emailExiste = await prisma.usuario.findUnique({
    where: { email: data.email.toLowerCase() },
  });
  if (emailExiste) throw new Error('E-mail já está em uso');

  // 3. Cria o usuário com role ALUNO
  const hash = await bcrypt.hash(data.password, 10);

  const usuario = await prisma.usuario.create({
    data: {
      name: aluno.name,
      email: data.email.toLowerCase(),
      password: hash,
      role: 'ALUNO',           // ← nova role (adicione no enum se precisar)
      tenantId: aluno.tenantId,
      aluno: {
        connect: { id: alunoId }, // ← liga automaticamente!
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  if (data.sendEmail) {
    console.log(`E-mail enviado para ${data.email} | Senha: ${data.password}`);
  }

  return {
    success: true,
    message: 'Login criado com sucesso! Aluno agora pode acessar o app.',
    usuario,
  };
},

//editar usuario aluno
async editarUsuarioDoAluno(
  alunoId: string,
  tenantId: string,
  data: {
    email?: string;
    password?: string;
    isActive?: boolean;
  }
) {
  // 1. Busca aluno + usuário
  const aluno = await prisma.aluno.findUnique({
    where: { id: alunoId },
    include: { usuario: true },
  });

  if (!aluno) throw new Error('Aluno não encontrado');
  if (aluno.tenantId !== tenantId) throw new Error('Acesso negado');
  if (!aluno.usuario) throw new Error('Este aluno não possui login');

  // 2. Prepara dados para update
  const updateData: any = {};

  if (data.email) {
    const emailExiste = await prisma.usuario.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (emailExiste && emailExiste.id !== aluno.usuario.id) {
      throw new Error('Este e-mail já está em uso');
    }
    updateData.email = data.email.toLowerCase();
  }

  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  if (data.isActive !== undefined) {
    updateData.isActive = data.isActive;
  }

  // 3. Atualiza o usuário
  const usuarioAtualizado = await prisma.usuario.update({
    where: { id: aluno.usuario.id },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      updatedAt: true,
    },
  });

  return {
    success: true,
    message: 'Login do aluno atualizado com sucesso!',
    aluno: { id: aluno.id, name: aluno.name },
    usuario: usuarioAtualizado,
  };
},

//buscar usuario aluno ID
async temUsuario(alunoId: string, tenantId: string) {
  const aluno = await prisma.aluno.findUnique({
    where: { id: alunoId },
    select: {
      id: true,
      name: true,
      tenantId: true,
      usuario: {
        select: {
          id: true,
          email: true,
          isActive: true,
          createdAt: true,
        },
      },
    },
  });

  if (!aluno) throw new Error('Aluno não encontrado');
  if (aluno.tenantId !== tenantId) throw new Error('Acesso negado');

  const temUsuario = !!aluno.usuario;

  return {
    success: true,
    aluno: {
      id: aluno.id,
      name: aluno.name,
    },
    temUsuario,
    usuario: aluno.usuario ? {
      id: aluno.usuario.id,
      email: aluno.usuario.email,
      isActive: aluno.usuario.isActive,
      criadoEm: aluno.usuario.createdAt,
    } : null,
  };
},

  //verificar aluno
  async getAll(tenantId: string) {
    return await prisma.aluno.findMany({
      where: { tenantId },
      include: {
        responsavel: {
          select: { id: true, name: true, phone: true, relacionamento: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  },

  //verificar aluno por Id
  async getById(id: string, tenantId: string) {
    const aluno = await prisma.aluno.findUnique({
      where: { id, tenantId },
      include: {
        responsavel: {
          select: { id: true, name: true, phone: true, relacionamento: true },
        },
      },
    });

    if (!aluno) throw new Error('Aluno não encontrado');
    return aluno;
  },

 //editar aluno
 async update(id: string, dto: Partial<CreateAlunoDto>, tenantId: string) {
  // SE estiver mudando o responsável → valida se existe e se é do mesmo tenant
  if (dto.responsavelId !== undefined) { // ← mudou ou removeu o responsável
    if (dto.responsavelId === null) {
      // Permitir remover o responsável (aluno maior de idade)
      // não faz nada aqui, só deixa null
    } else {
      // Tem um novo responsável → valida
      const responsavel = await prisma.responsavel.findUnique({
        where: { id: dto.responsavelId },
        select: { tenantId: true },
      });

      // CORREÇÃO AQUI: verifica se existe e se pertence ao tenant
      if (!responsavel) {
        throw new Error('Responsável não encontrado');
      }
      if (responsavel.tenantId !== tenantId) {
        throw new Error('Responsável não pertence a este tenant');
      }
    }
  }

  return await prisma.aluno.update({
    where: { id, tenantId },
    data: {
      name: dto.name,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      phone: dto.phone,
      responsavelId: dto.responsavelId ?? undefined, // ← aceita null ou undefined
      observations: dto.observations,
      status: dto.status,
    },
    include: {
      responsavel: {
        select: { id: true, name: true, phone: true, relacionamento: true },
      },
    },
  });
},

//Deletar  aluno
  async delete(id: string, tenantId: string) {
    const aluno = await prisma.aluno.findUnique({
      where: { id, tenantId },
      select: { id: true },
    });

    if (!aluno) throw new Error('Aluno não encontrado');

    await prisma.aluno.delete({ where: { id } });
  },
};