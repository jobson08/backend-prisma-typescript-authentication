// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token missing' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = payload; // { id, role, ... }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};