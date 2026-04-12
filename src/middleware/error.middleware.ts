// src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = { ...err };
  error.message = err.message;

  // 1. Zod Validation Error
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Dados inválidos',
      details: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      })),
    });
  }

  // 2. Prisma Known Request Error (ex: duplicidade, registro não encontrado)
  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = err.meta?.target ? (err.meta.target as string[]).join(', ') : 'campo';
      return res.status(409).json({
        success: false,
        error: `Já existe um registro com o mesmo ${field}`,
      });
    }

    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Registro não encontrado',
      });
    }

    // Outros códigos Prisma comuns
    return res.status(400).json({
      success: false,
      error: `Erro no banco de dados: ${err.message}`,
    });
  }

  // 3. Prisma Validation Error
  if (err instanceof PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      error: 'Dados inválidos para o banco',
      details: err.message,
    });
  }

  // 4. Erros conhecidos da nossa aplicação
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // 5. Erro desconhecido
  console.error('❌ ERRO NÃO TRATADO:', err);

  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { 
      message: err.message,
      stack: err.stack 
    }),
  });
};