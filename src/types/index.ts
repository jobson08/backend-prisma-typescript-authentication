export type UserRole = 'ADMIN' | 'TREINADOR' | 'AUXILIAR';

export interface CreateAlunoDTO {
  name: string;
  birthDate?: string;
  monthlyFee: number;
  dueDay?: number;
  responsavel: {
    name: string;
    cpf: string;
    phone: string;
    email: string;
  };
  tenantId: string;
  
}