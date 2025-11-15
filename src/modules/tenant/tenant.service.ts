// src/modules/tenant/tenant.service.ts
import { Tenant } from '@prisma/client';
import { CreateTenantDTO } from './tenant.types';
import { prisma } from '../../server';
import { cnpj, cpf } from 'cpf-cnpj-validator';

interface FindAllOptions {
  page: number;
  limit: number;
  skip: number;
  plan?: 'basico' | 'premium';
  sort: 'name' | 'createdAt';
  order: 'asc' | 'desc';
}

export class TenantService {
static async create(data: CreateTenantDTO): Promise<Tenant> {
    const { name, slug, domain, cpfCnpj, plan, monthlyFee } = data;

    // Validar slug único
    const slugExists = await prisma.tenant.findUnique({ where: { slug } });
    if (slugExists) {
      throw new Error('Slug já está em uso');
    }

    // Validar CPF/CNPJ
    if (cpfCnpj && !cpf.isValid(cpfCnpj) && !cnpj.isValid(cpfCnpj)) {
      throw new Error('CPF ou CNPJ inválido');
    }

    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        domain: domain ?? null,
        cpfCnpj: cpfCnpj ?? null,
        plan,
        monthlyFee,
      },
    });

    return tenant;
  }

  // FIND BY ID — CORRIGIDO!
  static async findById(id: string): Promise<Tenant | null> {
    return await prisma.tenant.findUnique({ where: { id } });
}

// VERIFICAR TODOS OS TENANTS
static async findAll(options: FindAllOptions): Promise<Tenant[]> {
    const { skip, limit, plan, sort, order } = options;

    const where: any = {};
    if (plan) where.plan = plan;

    return prisma.tenant.findMany({
      where,
      orderBy: { [sort]: order },
      skip,
      take: limit,
    });
  }

  static async count(plan?: 'basico' | 'premium'): Promise<number> {
    const where: any = {};
    if (plan) where.plan = plan;

    return prisma.tenant.count({ where });
  }

  static async findBySlug(slug: string): Promise<Tenant | null> {
  return await prisma.tenant.findUnique({
    where: { slug },
    });
  }
}
