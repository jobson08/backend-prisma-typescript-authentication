import { Request, Response } from 'express';
import { TenantService } from './tenant.service';
import { CreateTenantDTO } from './tenant.types';
import { isUUID } from './tenant.utils';

//criar Tenant
export class TenantController {
  static async create(req: Request, res: Response) {
    try {
      const data: CreateTenantDTO = req.body;
      const tenant = await TenantService.create(data);
      res.status(201).json(tenant);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
//BUSCAR POR ID
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Validação de UUID
      if (!isUUID(id)) {
        res.status(400).json({ error: 'ID inválido. Use um UUID válido.' });
        return;
      }

      const tenant = await TenantService.findById(id);

      if (!tenant) {
        res.status(404).json({ error: 'Tenant não encontrado' });
        return;
      }

      res.json(tenant);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // LISTAR TODOS OS TENANTS
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { 
        page = '1', 
        limit = '10', 
        plan, 
        sort = 'name', 
        order = 'asc' 
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = Math.min(parseInt(limit as string, 10), 100); // max 100
      const skip = (pageNum - 1) * limitNum;

      const tenants = await TenantService.findAll({
        page: pageNum,
        limit: limitNum,
        skip,
        plan: plan as 'basico' | 'premium' | undefined,
        sort: sort as 'name' | 'createdAt',
        order: order as 'asc' | 'desc',
      });

      res.json({
        data: tenants,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: await TenantService.count(plan as any),
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  //BUSCAR PO SLUNG
 static async getBySlug(req: Request, res: Response): Promise<void> {
  try {
    const { slug } = req.params;

    // VALIDAÇÃO: slug deve ter só letras, números, hífens
    if (!/^[a-z0-9-]+$/.test(slug)) {
      res.status(400).json({ error: 'Slug inválido. Use apenas letras minúsculas, números e hífens.' });
      return;
    }

    const tenant = await TenantService.findBySlug(slug);

    if (!tenant) {
      res.status(404).json({ error: 'Tenant não encontrado com este slug.' });
      return;
    }

    res.json(tenant);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

}