// src/services/usuario.service.ts
import { prisma } from '../config/database';
import bcrypt from 'bcrypt';

export const usuarioService = {
  async createTenantWithAdmin(dto: any, currentUserId: string) {
    const caller = await prisma.usuario.findUnique({
      where: { id: currentUserId },
    });

    if (!caller || caller.role !== 'SUPER_ADMIN') {
      throw new Error('Apenas Super Admin pode criar tenants');
    }

    const hashed = await bcrypt.hash(dto.admin.password, 12);

    return prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.tenantName,
          slug: dto.tenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        },
      });

      const admin = await tx.usuario.create({
        data: {
          name: dto.admin.name,
          email: dto.admin.email.toLowerCase(),
          password: hashed,
          role: 'ADMIN',
          tenantId: tenant.id,
          img: null,
        },
      });

      return {
        message: 'Tenant criado com sucesso!',
        tenant: { id: tenant.id, name: tenant.name },
        admin: { id: admin.id, email: admin.email },
      };
    });
  },
};