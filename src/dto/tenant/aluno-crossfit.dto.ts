import { z } from 'zod';

// --------------------------------------------------
// DTO de CRIAÇÃO (POST)
// Todos os campos obrigatórios (exceto os opcionais do schema)
export const createAlunoCrossfitSchema= z.object({
  nome: z.string()
    .min(3, 'Nome completo é obrigatório')
    .max(100, 'Nome muito longo (máx 100 caracteres)'),

  cpf: z.string()
    .regex(/^\d{11}$/, 'CPF deve conter exatamente 11 dígitos numéricos')
    .optional(),

  email: z.string()
    .email('E-mail inválido')
    .min(1, 'E-mail é obrigatório'),

  telefone: z.string()
    .regex(/^\d{10,11}$/, 'Telefone deve conter 10 ou 11 dígitos')
    .optional(),

  dataNascimento: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD')
    .refine((val) => !isNaN(Date.parse(val)), 'Data de nascimento inválida'),

  observacoes: z.string()
    .max(1000, 'Observações muito longas (máx 1000 caracteres)')
    .optional(),

  frequencia: z.number()
    .int('Frequência deve ser um número inteiro')
    .min(0, 'Frequência mínima é 0')
    .max(7, 'Frequência máxima é 7')
    .default(0),

  status: z.enum(["ATIVO", "INATIVO", "TRANCADO"])
    .default('ATIVO'),
    
    // Opcional: password se quiser permitir envio manual
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional(),  
});

// --------------------------------------------------
// DTO de ATUALIZAÇÃO (PUT/PATCH)
// Todos os campos opcionais
export const updateAlunoCrossfitSchema = createAlunoCrossfitSchema.partial().extend({
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional(),
});

// --------------------------------------------------
// DTO de RESPOSTA (o que o backend retorna)
// Inclui campos calculados e relações úteis
export const AlunoCrossfitResponseDTO = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  cpf: z.string().nullable(),
  email: z.string(),
  telefone: z.string().nullable(),
  dataNascimento: z.date(),
  observacoes: z.string().nullable(),
  frequencia: z.number().int(),
  status: z.enum(["ATIVO", "INATIVO", "TRANCADO"]),
  createdAt: z.date(),

  escolinhaId: z.string().uuid(),

  // Opcional: incluir resumo de mensalidades/presenças se desejar
  ultimoPagamento: z.date().nullable().optional(),
  totalMensalidades: z.number().int().optional(),
  presencasUltimos30Dias: z.number().int().optional(),

  // Relações (se incluir no find)
  userId: z.string().uuid().nullable().optional(),
});

// Criar ou atualizar uma turma de CrossFit
export const crossfitTurmaSchema = z.object({
  nome:               z.string().min(3, "Nome da turma obrigatório"),
  horario:            z.string().optional(),                    // ex: "Segunda e Quarta - 19h"
  valorMensalidade:   z.number().positive("Valor mensal obrigatório"),
  vagasMax:           z.number().int().positive().min(1).optional().default(15),
  descricao:          z.string().optional(),
  professorId:        z.string().uuid("Professor responsável obrigatório"),
  status:             z.enum(["ativa", "inativa", "lotada", "arquivada"]).optional().default("ativa"),
});

// Inscrever um aluno em uma turma
export const crossfitInscricaoSchema = z.object({
  aulaCrossfitId:     z.string().uuid("ID da turma obrigatório"),
  alunoId:            z.string().uuid("ID do aluno obrigatório"),
  dataInicio:         z.string().datetime("Data de início inválida").optional(),
  observacao:         z.string().optional(),
});

// Atualizar inscrição (status, observação, data, etc.)
export const updateCrossfitInscricaoSchema = z.object({
  id:                 z.string().uuid("ID da inscrição obrigatório"),
  dataInicio:         z.string().datetime().optional(),
  status:             z.enum(["ativo", "cancelado", "expulso", "expirado"]).optional(),
  observacao:         z.string().optional(),
});

// Tipos inferidos para uso no código
export type CreateAlunoCrossfitDto = z.infer<typeof createAlunoCrossfitSchema>;
export type UpdateAlunoCrossfitDto = z.infer<typeof updateAlunoCrossfitSchema>;
export type AlunoCrossfitResponseDTO = z.infer<typeof AlunoCrossfitResponseDTO>;
export type CrossfitTurmaDTO = z.infer<typeof crossfitTurmaSchema>;
export type CrossfitInscricaoDTO = z.infer<typeof crossfitInscricaoSchema>;
export type UpdateCrossfitInscricaoDTO = z.infer<typeof updateCrossfitInscricaoSchema>;