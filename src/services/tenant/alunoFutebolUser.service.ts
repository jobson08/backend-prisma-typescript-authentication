// src/services/tenant/alunoFutebol.service.ts
import { prisma } from '../../server';
import { AppError } from '../../utils/AppError';
import bcrypt from 'bcrypt';
import { 
  AlunoFutebolMeResponseDto, 
  ProximoTreinoAlunoDto, 
  EstatisticasAlunoDto 
} from '../../dto/tenant/alunoFutebolUser.dto';

export class AlunoFutebolService {

  async getMeuPerfil(escolinhaId: string, alunoId: string): Promise<AlunoFutebolMeResponseDto> {
    const aluno = await prisma.alunoFutebol.findFirst({
      where: { 
        id: alunoId,
        escolinhaId 
      },
      include: {
        user: true,
      }
    });

    if (!aluno) throw new AppError('Aluno não encontrado', 404);

    let idade: number | undefined;
    if (aluno.dataNascimento) {
      const hoje = new Date();
      idade = hoje.getFullYear() - aluno.dataNascimento.getFullYear();
      const mes = hoje.getMonth() - aluno.dataNascimento.getMonth();
      if (mes < 0 || (mes === 0 && hoje.getDate() < aluno.dataNascimento.getDate())) {
        idade--;
      }
    }

    return {
      id: aluno.id,
      name: aluno.user?.name || aluno.nome || '',
      email: aluno.user?.email || aluno.email || '',
      idade,
      categoria: aluno.categoria,
      nivel: "Avançado",
      frequenciaMes: aluno.frequenciaMes || 0,
      fotoUrl: aluno.fotoUrl,
      createdAt: aluno.createdAt,
    };
  }

  async getProximosTreinos(escolinhaId: string, alunoId: string): Promise<ProximoTreinoAlunoDto[]> {
    const presencas = await prisma.presenca.findMany({
      where: {
        alunoId: alunoId,
        treino: {
          data: { gte: new Date() },
          escolinhaId: escolinhaId,
        }
      },
      include: {
        treino: {
          include: {
            funcionarioTreinador: true,
          }
        }
      },
      orderBy: { treino: { data: 'asc' } },
      take: 6,
    });

    return presencas.map(p => ({
      id: p.treino.id,
      dia: p.treino.data.toLocaleDateString('pt-BR', { weekday: 'long' }),
      hora: `${p.treino.horaInicio} - ${p.treino.horaFim}`,
      treino: p.treino.nome,
      treinador: p.treino.funcionarioTreinador?.nome || 'Treinador',
      data: p.treino.data,
    }));
  }

  async getEstatisticas(escolinhaId: string, alunoId: string): Promise<EstatisticasAlunoDto> {
    return {
      treinosFeitosSemana: 3,
      metaSemanal: 5,
      frequenciaMes: 18,
      avaliacaoMedia: 4.8,
    };
  }

  async trocarSenha(alunoId: string, senhaAtual: string, novaSenha: string): Promise<void> {
    const aluno = await prisma.alunoFutebol.findUnique({
      where: { id: alunoId },
      include: { user: true }
    });

    if (!aluno?.user) throw new AppError('Usuário não encontrado', 404);

    const isValid = await bcrypt.compare(senhaAtual, aluno.user.password);
    if (!isValid) throw new AppError('Senha atual incorreta', 400);

    const hashedPassword = await bcrypt.hash(novaSenha, 10);

    await prisma.user.update({
      where: { id: aluno.user.id },
      data: { password: hashedPassword }
    });
  }

    async getPresencasAluno(escolinhaId: string, alunoId: string) {
    const presencas = await prisma.presenca.findMany({
      where: {
        alunoId,
        treino: { escolinhaId }
      },
      include: {
        treino: {
          select: {
            nome: true,
            horaInicio: true,
            horaFim: true,
            data: true
          }
        }
      },
      orderBy: { data: 'desc' },
      take: 10,
    });

    return presencas.map(p => ({
      id: p.id,
      data: p.data,
      presente: p.presente,
      treino: {
        nome: p.treino.nome,
        horaInicio: p.treino.horaInicio,
        horaFim: p.treino.horaFim,
      }
    }));
  }

  async getAvaliacoesAluno(escolinhaId: string, alunoId: string) {
    const avaliacoes = await prisma.avaliacao.findMany({
      where: {
        alunoId,
        escolinhaId
      },
      orderBy: { data: 'desc' },
      take: 10,
    });

    return avaliacoes.map(a => ({
      id: a.id,
      data: a.data,
      media: a.media,
      comentario: a.comentario,
      notaControleBola: a.notaControleBola,
      notaPasse: a.notaPasse,
      notaDrible: a.notaDrible,
      notaFinalizacao: a.notaFinalizacao,
    }));
  }
}