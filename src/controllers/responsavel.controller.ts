// src/controllers/responsavel.controller.ts
import { Request, Response } from 'express';
import { responsavelService } from '../services/responsavel.service';
import { createResponsavelSchema } from '../dto/responsavel.dto';

export const responsavelController = {
  // Criar responsável
  async create(req: Request, res: Response) {
    try {
      const dto = createResponsavelSchema.parse(req.body);
      const tenantId = req.tenantId!;

      const responsavel = await responsavelService.create(dto, tenantId);
      return res.status(201).json({ success: true, data: responsavel });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
      }
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  //controle criação do usuario responsavel

  async criarUsuario(req: Request, res: Response) {
  try {
    const { id } = req.params; // id do responsável
    const tenantId = req.tenantId!;
    const { email, password, sendEmail = false } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'E-mail e senha são obrigatórios',
      });
    }

    const resultado = await responsavelService.criarUsuarioParaResponsavel(id, tenantId, {
      email,
      password,
      sendEmail,
    });

    return res.status(201).json(resultado);
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
},

//editar usuario responsavel
async editarUsuario(req: Request, res: Response) {
  try {
    const { id } = req.params; // id do responsável
    const tenantId = req.tenantId!;
    const { email, password, isActive } = req.body;

    if (!email && !password && isActive === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Envie pelo menos um campo para atualizar',
      });
    }

    const resultado = await responsavelService.editarUsuarioDoResponsavel(id, tenantId, {
      email,
      password,
      isActive,
    });

    return res.json(resultado);
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
},
//buscar responsavrl com usuario ID
async temUsuario(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;

    const resultado = await responsavelService.temUsuario(id, tenantId);
    return res.json(resultado);
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
},
  // Listar todos
  async getAll(req: Request, res: Response) {
    const tenantId = req.tenantId!;
    const responsaveis = await responsavelService.getAll(tenantId);
    return res.json({ success: true, count: responsaveis.length, data: responsaveis });
  },

  // Buscar por ID
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId!;
      const responsavel = await responsavelService.getById(id, tenantId);
      return res.json({ success: true, data: responsavel });
    } catch (error: any) {
      return res.status(404).json({ success: false, error: error.message });
    }
  },

  // Atualizar
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dto = createResponsavelSchema.partial().parse(req.body);
      const tenantId = req.tenantId!;
      const updated = await responsavelService.update(id, dto, tenantId);
      return res.json({ success: true, data: updated });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  // Excluir
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId!;
      const result = await responsavelService.delete(id, tenantId);
      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },
};