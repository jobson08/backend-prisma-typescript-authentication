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

//DELETAR TENANT
/*async deleteTenant(tenantId: string): Promise<{
    success: true;
    message: string;
  }> {
    const tenantExists = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true },
    });

    if (!tenantExists) {
      throw new Error('Tenant não encontrado');
    }

    // DELEÇÃO EM CASCATA
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
      message: `Tenant "${tenantExists.name}" e todos os seus dados foram excluídos permanentemente.`,
    };
  },
*/
};
