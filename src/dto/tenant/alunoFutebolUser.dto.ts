// src/dto/tenant/alunoFutebol.dto.ts

export interface AlunoFutebolMeResponseDto {
  id: string;
  name: string;
  email: string;
  idade?: number;
  categoria?: string;
  nivel?: string;
  frequenciaMes: number;
  fotoUrl?: string | null;
  createdAt: Date;
}

export interface ProximoTreinoAlunoDto {
  id: string;
  dia: string;
  hora: string;
  treino: string;
  treinador: string;
  data: Date;
}

export interface EstatisticasAlunoDto {
  treinosFeitosSemana: number;
  metaSemanal: number;
  frequenciaMes: number;
  avaliacaoMedia: number;
}

// Novos DTOs para Progresso
export interface PresencaAlunoDto {
  id: string;
  data: Date;
  presente: boolean;
  treino: {
    nome: string;
    horaInicio: string;
    horaFim: string;
  };
}

export interface AvaliacaoAlunoDto {
  id: string;
  data: Date;
  media: number;
  comentario?: string;
  notaControleBola: number;
  notaPasse: number;
  notaDrible: number;
  notaFinalizacao: number;
}