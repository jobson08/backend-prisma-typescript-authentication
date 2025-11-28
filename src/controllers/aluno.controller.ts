// src/controllers/aluno.controller.ts
import { Request, Response } from 'express';
import { alunoService } from '../services/aluno.service';
import { createAlunoSchema, updateAlunoSchema} from '../dto/create-aluno.dto';
import { ZodError } from 'zod';

export const alunoController = {
  //cadastar aluno
  async create(req: Request, res: Response) {
    try {
      const dto = createAlunoSchema.parse(req.body);
      const tenantId = req.tenantId!;

      const aluno = await alunoService.create(dto, tenantId);
      return res.status(201).json({
        success: true,
        message: 'Aluno criado com sucesso!',
        data: aluno,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
      }
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  //cria usuario alunos
  async criarUsuario(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;
    const { email, password, sendEmail = false } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'E-mail e senha obrigatórios' });
    }

    const resultado = await alunoService.criarUsuarioParaAluno(id, tenantId, {
      email,
      password,
      sendEmail,
    });

    return res.status(201).json(resultado);
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
},

//editar usuario aluno
async editarUsuario(req: Request, res: Response) {
  try {
    const { id } = req.params; // id do aluno
    const tenantId = req.tenantId!;
    const { email, password, isActive } = req.body;

    if (!email && !password && isActive === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Envie pelo menos um campo para atualizar',
      });
    }

    const resultado = await alunoService.editarUsuarioDoAluno(id, tenantId, {
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

//buscar usuario aluno ID
async temUsuario(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;

    const resultado = await alunoService.temUsuario(id, tenantId);
    return res.json(resultado);
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
},

//verificar todos alunos
 async getAll(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const alunos = await alunoService.getAll(tenantId);
      return res.json({
        success: true,
        count: alunos.length,
        data: alunos,
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Erro ao listar alunos' });
    }
  },

  // VER ALUNO POR ID
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId!;

      const aluno = await alunoService.getById(id, tenantId);
      return res.json({ success: true, data: aluno });
    } catch (error: any) {
      return res.status(404).json({ success: false, error: error.message });
    }
  },

  // EDITAR ALUNO
async update(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const dto = updateAlunoSchema.parse(req.body);
    const tenantId = req.tenantId!;

    const aluno = await alunoService.update(id, dto, tenantId);

    return res.json({
      success: true,
      message: 'Aluno atualizado com sucesso!',
      data: aluno,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        detalhes: error.issues.map(issue => ({
         campo: issue.path.join('.'),
        mensagem: issue.message

        }))
      });
    }
   return res.status(400).json({ success: false, error: error.message || 'Erro interno' 
  });
  }
},

  // EXCLUIR ALUNO (opcional — com segurança)

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId!;

      await alunoService.delete(id, tenantId);
      return res.json({ success: true, message: 'Aluno excluído com sucesso' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

};