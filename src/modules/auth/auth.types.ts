export interface LoginDTO {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'TREINADOR' | 'AUXILIAR' | 'RESPONSAVEL' | 'ALUNO';
    tenantId: string | null;
    responsavelId?: string | null;
    alunoId?: string | null;
  };
}

export interface JWTPayload {
  userId: string;
  tenantId: string | null;
  role: string;
  responsavelId?: string;
  alunoId?: string;
  iat?: number;
  exp?: number;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}