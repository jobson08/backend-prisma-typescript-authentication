import { Request, Response } from 'express';
//import { ParamsDictionary } from 'express';
import { prisma } from "../server";
import bcrypt from 'bcrypt';

export const createOrUpdateLogin = async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params as { entityType: string; entityId: string };
    const { email, password, role } = req.body;
    const escolinhaId = req.escolinhaId!;

    // Valida usuário existente
    const existingUser = await prisma.user.findUnique({ where: { email } });

    let user;

    if (existingUser) {
      // Verifica se já está vinculado a outro registro do mesmo tipo
      switch (entityType.toLowerCase()) {
        case 'funcionario':
          if (existingUser.funcionarioId && existingUser.funcionarioId !== entityId) {
            return res.status(400).json({ error: "E-mail já vinculado a outro funcionário" });
          }
          break;
        case 'alunofutebol':
          if (existingUser.alunoFutebolId && existingUser.alunoFutebolId !== entityId) {
            return res.status(400).json({ error: "E-mail já vinculado a outro aluno" });
          }
          break;
        case 'alunocrossfit':
          if (existingUser.alunoCrossfitId && existingUser.alunoCrossfitId !== entityId) {
            return res.status(400).json({ error: "E-mail já vinculado a outro aluno crossfit" });
          }
          break;
        case 'responsavel':
          if (existingUser.responsavelId && existingUser.responsavelId !== entityId) {
            return res.status(400).json({ error: "E-mail já vinculado a outro responsável" });
          }
          break;
        default:
          return res.status(400).json({ error: "Tipo de entidade inválido" });
      }

      // Atualiza senha (ou outros campos)
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          password: await bcrypt.hash(password, 10),
        },
      });
    } else {
      // Cria novo User
      const hashed = await bcrypt.hash(password, 10);

      user = await prisma.user.create({
        data: {
          email,
          password: hashed,
          name: 'Nome do ' + entityType, // pegue do entity depois se quiser
          role: role || 'FUNCIONARIO', // ajuste por tipo
          escolinhaId,
          // Vincula ao tipo correto
          ...(entityType.toLowerCase() === 'funcionario' && { funcionarioId: entityId }),
          ...(entityType.toLowerCase() === 'alunofutebol' && { alunoFutebolId: entityId }),
          ...(entityType.toLowerCase() === 'alunocrossfit' && { alunoCrossfitId: entityId }),
          ...(entityType.toLowerCase() === 'responsavel' && { responsavelId: entityId }),
        },
      });
    }

    res.status(existingUser ? 200 : 201).json({
      success: true,
      message: existingUser ? "Login atualizado" : "Login criado",
      data: user,
    });
  } catch (err) {
    console.error('[createOrUpdateLogin] Erro:', err);
    res.status(500).json({ error: "Erro ao criar/atualizar login" });
  }
};