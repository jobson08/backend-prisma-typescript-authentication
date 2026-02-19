import { prisma } from '../../config/database';
import { CreateTreinoDTO } from '../../dto/tenant/treinos-futebol.dto';

export class TreinosFutebolService {

 async createTreino(escolinhaId: string, dto: CreateTreinoDTO) {
  try {
  //  console.log('[SERVICE CREATE TREINO] Dados recebidos:', dto);
   // console.log('[SERVICE] escolinhaId:', escolinhaId);

    const treino = await prisma.treino.create({
      data: {
        nome: dto.nome,
        descricao: dto.descricao || null,
        data: new Date(dto.data + 'T00:00:00.000Z'), // força UTC para evitar shift
        horaInicio: dto.horaInicio,
        horaFim: dto.horaFim,
        categoria: dto.categoria,
        local: dto.local,
        escolinhaId,
       funcionarioTreinadorId: dto.funcionarioTreinadorId,
      },
    });

    console.log('[SERVICE] Treino criado com ID:', treino.id);
    return treino;
  } catch (err) {
    console.error('[CREATE TREINO SERVICE ERROR FULL]', err);
    //console.error('[STACK]', err.stack || 'Sem stack trace');
    throw err; // relança para o controller capturar
  }
}

  async listTreinos(escolinhaId: string) {
    return prisma.treino.findMany({
      where: { escolinhaId },
      include: { funcionarioTreinador: { select: { nome: true } } },
      orderBy: { data: 'desc' },
    });
  }

  // Se precisar de update, delete, get by id...
}