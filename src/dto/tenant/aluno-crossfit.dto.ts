import { z } from 'zod';

// --------------------------------------------------
// DTO de CRIAÇÃO (POST)
// Todos os campos obrigatórios (exceto os opcionais do schema)
export const CreateAlunoCrossfitDTO = z.object({
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

  status: z.enum(['ativo', 'inativo', 'trancado'])
    .default('ativo'),
});

// --------------------------------------------------
// DTO de ATUALIZAÇÃO (PUT/PATCH)
// Todos os campos opcionais
export const UpdateAlunoCrossfitDTO = CreateAlunoCrossfitDTO.partial();

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
  status: z.enum(['ativo', 'inativo', 'trancado']),
  createdAt: z.date(),

  escolinhaId: z.string().uuid(),

  // Opcional: incluir resumo de mensalidades/presenças se desejar
  ultimoPagamento: z.date().nullable().optional(),
  totalMensalidades: z.number().int().optional(),
  presencasUltimos30Dias: z.number().int().optional(),

  // Relações (se incluir no find)
  userId: z.string().uuid().nullable().optional(),
});

// Tipos inferidos para uso no código
export type CreateAlunoCrossfitDTO = z.infer<typeof CreateAlunoCrossfitDTO>;
export type UpdateAlunoCrossfitDTO = z.infer<typeof UpdateAlunoCrossfitDTO>;
export type AlunoCrossfitResponseDTO = z.infer<typeof AlunoCrossfitResponseDTO>;