// src/controllers/superadmin.controller.ts
import { Request, Response } from 'express';
import { createEscolinhaSchema } from '../dto/create-escolinha.dto';
import { EscolinhaService } from '../services/escolinha.service';
import { z } from 'zod';

const escolinhaService = new EscolinhaService();

export const criarEscolinha = async (req: Request, res: Response) => {
  try {
    const data = createEscolinhaSchema.parse(req.body);

    const escolinha = await escolinhaService.criarEscolinha(data);

    res.status(201).json({
      success: true,
      message: "Escolinha criada com sucesso!",
      data: {
        id: escolinha.id,
        nome: escolinha.nome,
        emailContato: escolinha.emailContato,
        planoSaaS: escolinha.planoSaaS,
        adminEmail: data.adminEmail,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Dados inválidos",
        details: error.issues.map(i => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    console.error('Erro ao criar escolinha:', error);
    res.status(500).json({ error: 'Erro interno ao criar escolinha' });
  }
};