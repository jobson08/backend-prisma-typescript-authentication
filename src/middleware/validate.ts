// src/middlewares/validate.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.query);
      (req as any).validatedQuery = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Erro de validação nos dados enviados',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.') || 'mes',
            message: issue.message,
          })),
        });
      }

      // Se for outro erro, passa para o error middleware
      next(error);
    }
  };
};