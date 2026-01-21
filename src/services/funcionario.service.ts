import { prisma } from '../config/database';
import { CreateFuncionarioDto, UpdateFuncionarioDto } from '../dto/tenant/funcionario.dto';

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

  /**
   * Atualiza um funcionário (campos parciais)
   */
  async update(escolinhaId: string, funcionarioId: string, data: UpdateFuncionarioDto) {
    // Valida existência e permissão
    await this.findById(escolinhaId, funcionarioId);

    return prisma.funcionario.update({
      where: { id: funcionarioId },
      data,
    });
  }

// Listar todos os funcionários da escolinha
  async list(escolinhaId: string) {
    return prisma.funcionario.findMany({
      where: { escolinhaId },
      orderBy: { nome: 'asc' },
      select: {
        id: true,
        nome: true,
        cargo: true,
        salario: true,
        telefone: true,
        email: true,
        observacoes: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // Buscar por ID (da escolinha atual)
  async findById(escolinhaId: string, funcionarioId: string) {
    const funcionario = await prisma.funcionario.findFirst({
      where: {
        id: funcionarioId,
        escolinhaId,
      },
    });

    if (!funcionario) {
      throw new Error('Funcionário não encontrado ou não pertence à escolinha');
    }

    return funcionario;
  }

  // Excluir
  async delete(escolinhaId: string, funcionarioId: string) {
    await this.findById(escolinhaId, funcionarioId); // valida existência

    await prisma.funcionario.delete({
      where: { id: funcionarioId },
    });

    return { message: 'Funcionário excluído com sucesso' };
  }
}