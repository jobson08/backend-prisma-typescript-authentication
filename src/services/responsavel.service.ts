// src/services/responsavel.service.ts
import { prisma } from '../config/database';
import { CreateResponsavelDto } from '../dto/responsavel.dto';
import bcrypt from 'bcrypt';

export const responsavelService = {
  //cria responsavel
  async create(dto: CreateResponsavelDto, tenantId: string) {
    return await prisma.responsavel.create({
data: {
      tenantId,
      name: dto.name,
      phone: dto.phone,
      email: dto.email ?? null,
      cpf: dto.cpf ?? null,
      relacionamento: dto.relacionamento ?? null,
      observations: dto.observations ?? null,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      cpf: true,
      relacionamento: true,     // ← pode selecionar agora
      observations: true,
      createdAt: true,
    },
  });
},
  async getAll(tenantId: string) {
    return await prisma.responsavel.findMany({
      where: { tenantId },
        select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            cpf: true,
            relacionamento: true,     // ← agora funciona
            _count: { select: { alunos: true } },
      },
      orderBy: { name: 'asc' },
    });
  },

  //cria usuario responsavel
async criarUsuarioParaResponsavel(
  responsavelId: string,
  tenantId: string,
  data: { email: string; password: string; sendEmail?: boolean }
) {
  // 1. Verifica se o responsável existe e pertence ao tenant
  const responsavel = await prisma.responsavel.findUnique({
    where: { id: responsavelId },
    include: { usuario: true },
  });

  if (!responsavel) throw new Error('Responsável não encontrado');
  if (responsavel.tenantId !== tenantId) throw new Error('Acesso negado');

  // 2. Já tem usuário?
  if (responsavel.usuario) throw new Error('Este responsável já possui login');

  // 3. Verifica se email já existe
  const emailExiste = await prisma.usuario.findUnique({
    where: { email: data.email.toLowerCase() },
  });
  if (emailExiste) throw new Error('Este e-mail já está sendo usado');

  // 4. Cria o usuário
  const hash = await bcrypt.hash(data.password, 10);

  const usuario = await prisma.usuario.create({
    data: {
      name: responsavel.name,
      email: data.email.toLowerCase(),
      password: hash,
      role: 'RESPONSAVEL',
      tenantId: responsavel.tenantId,
      responsavel: {
        connect: { id: responsavelId }, // ← Liga automaticamente!
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

  // 5. Opcional: envia e-mail
  if (data.sendEmail) {
    console.log(`E-mail enviado para ${data.email} | Senha: ${data.password}`);
    // await enviarEmailBoasVindas(data.email, data.password);
  }

  return {
    success: true,
    message: 'Login criado com sucesso! Responsável pode acessar o app.',
    usuario,
  };
},

//editar usuario responsavel
async editarUsuarioDoResponsavel(
  responsavelId: string,
  tenantId: string,
  data: {
    email?: string;
    password?: string;
    isActive?: boolean;
  }
) {
  // 1. Busca responsável + usuário
  const responsavel = await prisma.responsavel.findUnique({
    where: { id: responsavelId },
    include: { usuario: true },
  });

  if (!responsavel) throw new Error('Responsável não encontrado');
  if (responsavel.tenantId !== tenantId) throw new Error('Acesso negado');
  if (!responsavel.usuario) throw new Error('Este responsável não possui login');

  // 2. Prepara dados para update
  const updateData: any = {};

  if (data.email) {
    const emailExiste = await prisma.usuario.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (emailExiste && emailExiste.id !== responsavel.usuario.id) {
      throw new Error('Este e-mail já está sendo usado por outro usuário');
    }
    updateData.email = data.email.toLowerCase();
  }

  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  if (data.isActive !== undefined) {
    updateData.isActive = data.isActive; // ← precisa ter esse campo no Usuario!
  }

  // 3. Atualiza o usuário
  const usuarioAtualizado = await prisma.usuario.update({
    where: { id: responsavel.usuario.id },
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
    message: 'Usuário do responsável atualizado com sucesso!',
    usuario: usuarioAtualizado,
  };
},

//buscar responsavel usuario ID 
async temUsuario(responsavelId: string, tenantId: string) {
  const responsavel = await prisma.responsavel.findUnique({
    where: { id: responsavelId },
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

  if (!responsavel) throw new Error('Responsável não encontrado');
  if (responsavel.tenantId !== tenantId) throw new Error('Acesso negado');

  const temUsuario = !!responsavel.usuario;

  return {
    success: true,
    responsavel: {
      id: responsavel.id,
      name: responsavel.name,
    },
    temUsuario,
    usuario: responsavel.usuario ? {
      id: responsavel.usuario.id,
      email: responsavel.usuario.email,
      isActive: responsavel.usuario.isActive,
      criadoEm: responsavel.usuario.createdAt,
    } : null,
  };
},
// pesquisar todos responsavel
  async getById(id: string, tenantId: string) {
    const responsavel = await prisma.responsavel.findUnique({
      where: { id, tenantId },
      include: { alunos: { select: { id: true, name: true } } },
    });

    if (!responsavel) throw new Error('Responsável não encontrado');
    return responsavel;
  },

  async update(id: string, dto: Partial<CreateResponsavelDto>, tenantId: string) {
    return await prisma.responsavel.update({
      where: { id, tenantId },
      data: dto,
      select: { id: true, name: true, phone: true, email: true },
    });
  },

  async delete(id: string, tenantId: string) {
    // Verifica se tem alunos vinculados
    const count = await prisma.aluno.count({ where: { responsavelId: id } });
    if (count > 0) {
      throw new Error('Não é possível excluir: responsável tem alunos vinculados');
    }

    await prisma.responsavel.delete({ where: { id, tenantId } });
    return { success: true, message: 'Responsável excluído com sucesso' };
  },
};