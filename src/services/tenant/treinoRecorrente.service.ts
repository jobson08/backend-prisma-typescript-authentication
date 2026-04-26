// src/services/tenant/treinoRecorrente.service.ts
import { prisma } from '../../server';
import { AppError } from '../../utils/AppError';
import { 
  CreateTreinoRecorrenteDto, 
  TreinoRecorrenteResponseDto, 
  TreinoGeradoDto, 
  UpdateTreinoRecorrenteDto
} from '../../dto/tenant/treinoRecorrente.dto';

export class TreinoRecorrenteService {

  async create(data: CreateTreinoRecorrenteDto, escolinhaId: string): Promise<TreinoRecorrenteResponseDto> {
    const treino = await prisma.treinoRecorrente.create({
   data: {
        nome: data.nome,
        descricao: data.descricao || null,
        categoria: data.categoria,
        diasSemana: data.diasSemana,           // ← Array
        horaInicio: data.horaInicio,
        horaFim: data.horaFim,
        local: data.local,
        funcionarioTreinadorId: data.funcionarioTreinadorId,
        escolinhaId,
      },
      include: {
        funcionarioTreinador: {
          select: { id: true, nome: true }
        }
      }
    });

    return {
     id: treino.id,
      nome: treino.nome,
      descricao: treino.descricao,
      categoria: treino.categoria,
      diasSemana: treino.diasSemana,
      horaInicio: treino.horaInicio,
      horaFim: treino.horaFim,
      local: treino.local,
      ativo: treino.ativo,
      funcionarioTreinador: {
        id: treino.funcionarioTreinador.id,
        nome: treino.funcionarioTreinador.nome,
      },
      createdAt: treino.createdAt,
      updatedAt: treino.updatedAt,
    };
  }

  async listByEscolinha(escolinhaId: string) {
    return prisma.treinoRecorrente.findMany({
      where: { escolinhaId, ativo: true },
      include: {
        funcionarioTreinador: {
          select: { nome: true }
        }
      },
      orderBy: { diasSemana: 'asc' }
    });
  }
  
async getById(id: string, escolinhaId: string) {
  const treino = await prisma.treinoRecorrente.findFirst({
    where: { 
      id,
      escolinhaId 
    },
    include: {
      funcionarioTreinador: {
        select: { id: true, nome: true }
      }
    }
  });

  if (!treino) {
    throw new AppError('Treino recorrente não encontrado', 404);
  }

  return treino;
}

async generateTreinosMes(escolinhaId: string, mes: string): Promise<TreinoGeradoDto[]> {
  const [ano, mesNum] = mes.split('-').map(Number);
  const dataInicio = new Date(ano, mesNum - 1, 1);
  const dataFim = new Date(ano, mesNum, 0); // último dia do mês

  const recorrentes = await prisma.treinoRecorrente.findMany({
    where: { escolinhaId, ativo: true },
    include: {
      funcionarioTreinador: {
        select: { nome: true }
      }
    }
  });

  const treinosGerados: TreinoGeradoDto[] = [];

  for (let d = new Date(dataInicio); d <= dataFim; d.setDate(d.getDate() + 1)) {
    const diaSemana = d.getDay(); // 0 = Domingo, 1 = Segunda, ...

    // Verifica se o dia da semana está no array de dias do treino recorrente
    const treinoDoDia = recorrentes.find(t => t.diasSemana.includes(diaSemana));

    if (treinoDoDia) {
      treinosGerados.push({
        id: `temp-${d.toISOString()}`,
        data: new Date(d),
        nome: treinoDoDia.nome,
        horaInicio: treinoDoDia.horaInicio,
        horaFim: treinoDoDia.horaFim,
        local: treinoDoDia.local,
        treinador: treinoDoDia.funcionarioTreinador?.nome || 'Treinador',
      });
    }
  }

  return treinosGerados;
}

async update(id: string, data: UpdateTreinoRecorrenteDto, escolinhaId: string): Promise<TreinoRecorrenteResponseDto> {
  const treino = await prisma.treinoRecorrente.update({
    where: { 
      id,
      escolinhaId 
    },
    data: {
      nome: data.nome,
      descricao: data.descricao,
      categoria: data.categoria,
      diasSemana: data.diasSemana,
      horaInicio: data.horaInicio,
      horaFim: data.horaFim,
      local: data.local,
      funcionarioTreinadorId: data.funcionarioTreinadorId,
      ativo: data.ativo,
    },
    include: {
      funcionarioTreinador: {
        select: { id: true, nome: true }
      }
    }
  });

  return {
    id: treino.id,
    nome: treino.nome,
    descricao: treino.descricao,
    categoria: treino.categoria,
    diasSemana: treino.diasSemana,
    horaInicio: treino.horaInicio,
    horaFim: treino.horaFim,
    local: treino.local,
    ativo: treino.ativo,
    funcionarioTreinador: {
      id: treino.funcionarioTreinador.id,
      nome: treino.funcionarioTreinador.nome,
    },
    createdAt: treino.createdAt,
    updatedAt: treino.updatedAt,
  };
}

async delete(id: string, escolinhaId: string): Promise<void> {
  const treino = await prisma.treinoRecorrente.findFirst({
    where: { 
      id, 
      escolinhaId 
    }
  });

  if (!treino) {
    throw new AppError('Treino recorrente não encontrado', 404);
  }

  // Soft delete (recomendado)
  await prisma.treinoRecorrente.update({
    where: { id },
    data: { ativo: false }
  });

  // Ou hard delete (se preferir remover definitivamente):
  // await prisma.treinoRecorrente.delete({ where: { id } });
}
}