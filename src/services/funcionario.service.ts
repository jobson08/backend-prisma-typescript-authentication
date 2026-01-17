import { prisma } from '../config/database';
import { CreateFuncionarioDto } from '../dto/funcionario.dto';

export class FuncionarioService {
  async create(escolinhaId: string, data: CreateFuncionarioDto) {
    const funcionario = await prisma.funcionario.create({
      data: {
        ...data,
        escolinhaId, // vincula à escolinha atual
      },
    });

    return funcionario;
  }

  // Futuras funções: list, update, delete...
}