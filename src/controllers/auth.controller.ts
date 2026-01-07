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

// Validação do login
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

type LoginInput = z.infer<typeof loginSchema>;

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginInput = loginSchema.parse(req.body);

    // Busca o usuário completo (traz password, img, escolinha, tudo)
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        escolinha: {
          select: {
            id: true,
            nome: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verifica a senha
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gera JWT
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        tenantId: user.escolinhaId,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove a senha antes de enviar pro frontend
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso!',
      token,
      user: {
        ...userWithoutPassword,
        tenantId: user.escolinhaId,
        escolinha: user.escolinha
          ? {
              id: user.escolinha.id,
              nome: user.escolinha.nome,
              logoUrl: user.escolinha.logoUrl,
            }
          : null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};