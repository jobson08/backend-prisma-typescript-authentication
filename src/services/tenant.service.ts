// src/services/usuario.service.ts (ou tenant.service.ts)
import { prisma } from '../config/database';
import bcrypt from 'bcrypt';

//VERIFICAR TODOS OS TENANTS
export const tenantService = {
async getAllTenants() {
  return await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      domain: true,
      cpfCnpj: true,
      plan: true,
      monthlyFee: true,
      createdAt: true,
      _count: {
        select: {
          alunos: true,
          usuarios: true,
          responsaveis: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
},

//EDITAR O TENANT
async updateTenant(tenantId: string, data: {
    name?: string;
    slug?: string;
    domain?: string | null;
    cpfCnpj?: string | null;
    plan?: string;
    monthlyFee?: number;
  }) {
    // Atualiza o tenant
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: data.name,
        slug: data.name 
          ? data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') 
          : undefined,
        domain: data.domain,
        cpfCnpj: data.cpfCnpj,
        plan: data.plan,
        monthlyFee: data.monthlyFee,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        cpfCnpj: true,
        plan: true,
        monthlyFee: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      message: 'Tenant atualizado com sucesso!',
      tenant: updatedTenant,
    };
  },

  //VERIFICAR TENANT POR ID
  async getTenantById(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      domain: true,
      cpfCnpj: true,
      plan: true,
      monthlyFee: true,
      createdAt: true,
      updatedAt: true,

      // Contadores
      _count: {
        select: {
          alunos: true,
          usuarios: true,
          responsaveis: true,
          movimentacoes: true,
          categorias: true,
        },
      },

      // Admin principal (primeiro usuário com role ADMIN)
      usuarios: {
        where: { role: 'ADMIN' },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
        take: 1,
      },
    },
  });

  if (!tenant) {
    throw new Error('Tenant não encontrado');
  }

  return {
    success: true,
    tenant,
  };
},

//editar usuario tenant
async editarUsuarioAdminDoTenant(
  tenantId: string,
  data: {
    email?: string;
    password?: string;
    isActive?: boolean;
  }
) {
  // 1. Busca o tenant + usuário admin
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      usuarios: {
        where: { role: 'ADMIN' },
        take: 1,
      },
    },
  });

  if (!tenant) throw new Error('Tenant não encontrado');
  if (tenant.usuarios.length === 0) throw new Error('Este tenant não tem admin');

  const adminUsuario = tenant.usuarios[0];

  // 2. Prepara update
  const updateData: any = {};

  if (data.email) {
    const emailExiste = await prisma.usuario.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (emailExiste && emailExiste.id !== adminUsuario.id) {
      throw new Error('E-mail já está em uso');
    }
    updateData.email = data.email.toLowerCase();
  }

  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  if (data.isActive !== undefined) {
    updateData.isActive = data.isActive;
  }

  // 3. Atualiza
  const usuarioAtualizado = await prisma.usuario.update({
    where: { id: adminUsuario.id },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      role: true,
    },
  });

  return {
    success: true,
    message: `Admin do tenant "${tenant.name}" atualizado com sucesso!`,
    tenant: { id: tenant.id, name: tenant.name },
    usuario: usuarioAtualizado,
  };
},

//buscar tenant com usuario ID
async getAdminUsuarioDoTenant(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      isActive: true,
      usuarios: {
        where: { role: 'ADMIN' },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        take: 1, // normalmente só tem 1 admin por tenant
      },
    },
  });

  if (!tenant) throw new Error('Tenant não encontrado');

  const adminUsuario = tenant.usuarios[0] || null;

  return {
    success: true,
    tenant: {
      id: tenant.id,
      name: tenant.name,
      isActive: tenant.isActive,
    },
    temAdminUsuario: !!adminUsuario,
    adminUsuario: adminUsuario ? {
      id: adminUsuario.id,
      name: adminUsuario.name,
      email: adminUsuario.email,
      isActive: adminUsuario.isActive,
      criadoEm: adminUsuario.createdAt,
      atualizadoEm: adminUsuario.updatedAt,
    } : null,
  };
},

//ATIVAR OU BLOQUEAR TENANT FORA DA FUNÇÃO
 async  toggleTenantBlock(
  tenantId: string,
  block: boolean,
  reason?: string
): Promise<{
  success: true;
  message: string;
  tenant: { id: string; name: string; isActive: boolean; blockedReason: string | null };
}> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true },
  });

  if (!tenant) throw new Error('Tenant não encontrado');

  const updated = await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      isActive: !block,
      blockedAt: block ? new Date() : null,
      blockedReason: block ? (reason || 'Bloqueado pelo administrador') : null,
    },
    select: {
      id: true,
      name: true,
      isActive: true,
      blockedReason: true,
    },
  });

  return {
    success: true,
    message: block 
      ? `Tenant "${updated.name}" foi BLOQUEADO.` 
      : `Tenant "${updated.name}" foi DESBLOQUEADO.`,
    tenant: {
      id: updated.id,
      name: updated.name,
      isActive: updated.isActive,
      blockedReason: updated.blockedReason,
    },
  };
},

//DELETAR TENANT
async deleteTenant(tenantId: string) {
  // Primeiro verifica se o tenant existe
  const tenantExists = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true },
  });

  if (!tenantExists) {
    throw new Error('Tenant não encontrado');
  }

  // DELETA EM CASCATA (tudo que pertence ao tenant)
  await prisma.$transaction(async (tx) => {
    // 1. Deleta mensalidades
    await tx.mensalidade.deleteMany({ where: { aluno: { tenantId } } });

    // 2. Deleta movimentações
    await tx.movimentacao.deleteMany({ where: { tenantId } });

    // 3. Deleta categorias financeiras
    await tx.categoriaFinanceira.deleteMany({ where: { tenantId } });

    // 4. Deleta alunos
    await tx.aluno.deleteMany({ where: { tenantId } });

    // 5. Deleta responsáveis
    await tx.responsavel.deleteMany({ where: { tenantId } });

    // 6. Deleta usuários do tenant
    await tx.usuario.deleteMany({ where: { tenantId } });

    // 7. Finalmente deleta o tenant
    await tx.tenant.delete({ where: { id: tenantId } });
  });

  return {
    success: true,
    message: `Tenant "${tenantExists.name}" e todos os seus dados foram excluídos permanentemente.`,
  };
}

};






