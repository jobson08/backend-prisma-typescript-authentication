import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ChangePasswordDTO, LoginDTO } from './auth.types';

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const data: LoginDTO = req.body;
      const result = await AuthService.login(data);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  static async me(req: Request, res: Response) {
    // Rota protegida: retorna dados do usuário logado
    res.json({ user: req.user });
  }
// ALTERA SENHA SUPER ADMIN
  static async changePassword(req: Request, res: Response) {
  try {
    const { userId } = req.user!;
    const data: ChangePasswordDTO = req.body;

    if (data.newPassword !== data.confirmPassword) {
      return res.status(400).json({ error: 'As senhas não coincidem' });
    }

    if (data.newPassword.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
    }

    await AuthService.changePassword(userId, data.currentPassword, data.newPassword);

    res.json({ message: 'Senha alterada com sucesso!' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
}