// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../config/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não definido no .env');
}

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Busca completa com todas as relações necessárias
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        escolinha: {
          select: { id: true, nome: true, logoUrl: true }
        },
        alunoFutebol: { select: { id: true } },
        alunoCrossfit: { select: { id: true } },
        treinador: { select: { id: true } },
        funcionario: {                    // ← ESSENCIAL para TREINADOR
          select: { 
            id: true, 
            cargo: true 
          } 
        },
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gera o token
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        tenantId: user.escolinhaId,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        cargo: user.funcionario?.cargo,           // ← Aqui está o cargo
        funcionarioId: user.funcionario?.id,
        escolinhaId: user.escolinhaId,
        escolinha: user.escolinha ? {
          id: user.escolinha.id,
          nome: user.escolinha.nome,
          logoUrl: user.escolinha.logoUrl,
        } : null,
      },
    });
  } catch (error: any) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: error.message || 'Erro interno no servidor' });
  }
};