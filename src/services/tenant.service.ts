// src/services/usuario.service.ts (ou tenant.service.ts)
import { prisma } from '../config/database';

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
}
};

//ATIVAR OU BLOQUEAR TENANT FORA DA FUNÇÃO

export async function toggleTenantBlock(
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
}


//DELETAR TENANT
export async function deleteTenant(tenantId: string) {
    // FORÇA O TYPESCRIPT A ACEITAR COM ESTA SINTAXE:
    return await (async function () {
      const tenantExists = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, name: true },
      });

      if (!tenantExists) {
        throw new Error('Tenant não encontrado');
      }

      await prisma.$transaction(async (tx) => {
        await tx.mensalidade.deleteMany({ where: { aluno: { tenantId } } });
        await tx.movimentacao.deleteMany({ where: { tenantId } });
        await tx.categoriaFinanceira.deleteMany({ where: { tenantId } });
        await tx.aluno.deleteMany({ where: { tenantId } });
        await tx.responsavel.deleteMany({ where: { tenantId } });
        await tx.usuario.deleteMany({ where: { tenantId } });
        await tx.tenant.delete({ where: { id: tenantId } });
      });

      return {
        success: true,
        message: `Tenant "${tenantExists.name}" excluído com sucesso!`,
      };
    })();
  }



