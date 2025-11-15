import { prisma } from '../../config/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { LoginDTO, LoginResponse, JWTPayload } from './auth.types';

const JWT_SECRET = process.env.JWT_SECRET || 'escolinha-secret-2025';
const JWT_EXPIRES = '7d';

export class AuthService {
  static async login(data: LoginDTO): Promise<LoginResponse> {
    const { email, password } = data;

    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: {
        tenant: true,
        responsavel: true,
        aluno: true,
      },
    });

    if (!usuario) {
      throw new Error('Email ou senha inválidos');
    }

    const senhaValida = await bcrypt.compare(password, usuario.password);
    if (!senhaValida) {
      throw new Error('Email ou senha inválidos');
    }

    const payload: JWTPayload = {
      userId: usuario.id,
      tenantId: usuario.tenantId || null,
      role: usuario.role,
      responsavelId: usuario.responsavelId || undefined,
      alunoId: usuario.alunoId || undefined,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    return {
      token,
      user: {
        id: usuario.id,
        email: usuario.email,
        name: usuario.name,
        role: usuario.role as any,
        tenantId: usuario.tenantId || null,
        responsavelId: usuario.responsavelId || undefined,
        alunoId: usuario.alunoId || undefined,
      },
    };
  }

  static verifyToken(token: string): JWTPayload {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  }
// ALTERAR SENHA SUPER ADMIN TEM QUE ESTAR LOGADO
  static async changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
  });

  if (!usuario) throw new Error('Usuário não encontrado');

  const senhaValida = await bcrypt.compare(currentPassword, usuario.password);
  if (!senhaValida) throw new Error('Senha atual incorreta');

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  await prisma.usuario.update({
    where: { id: userId },
    data: { password: hashedNewPassword },
  });
}
}