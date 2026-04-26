// src/dto/tenant/treinoRecorrente.dto.ts

export interface CreateTreinoRecorrenteDto {
  nome: string;
  descricao?: string | null;
  categoria: string;
  diasSemana: number[];          // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  horaInicio: string;
  horaFim: string;
  local: string;
  funcionarioTreinadorId: string;
}

export interface TreinoRecorrenteResponseDto {
  id: string;
  nome: string;
  descricao?: string | null;
  categoria: string;
  diasSemana: number[];
  horaInicio: string;
  horaFim: string;
  local: string;
  ativo: boolean;
  funcionarioTreinador: {
    id: string;
    nome: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface TreinoGeradoDto {
  id: string;
  data: Date;
  nome: string;
  horaInicio: string;
  horaFim: string;
  local: string;
  treinador: string;
}

export interface UpdateTreinoRecorrenteDto {
  nome?: string;
  descricao?: string | null;
  categoria?: string;
  diasSemana?: number[];
  horaInicio?: string;
  horaFim?: string;
  local?: string;
  funcionarioTreinadorId?: string;
  ativo?: boolean;
}