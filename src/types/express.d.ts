// src/types/express.d.ts
import 'express';
import { JWTPayload } from '../modules/auth/auth.types';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}