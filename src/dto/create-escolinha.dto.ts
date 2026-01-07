// src/dto/create-escolinha.dto.ts
import { z } from 'zod';

export const createEscolinhaSchema = z.object({
  // Dados básicos da escolinha
  nome: z.string().min(3, "Nome da escolinha deve ter pelo menos 3 caracteres"),
  endereco: z.string().optional(),
  logoUrl: z.string().url("URL da logo inválida").optional().or(z.literal("")),

  // Documento da escolinha
  tipoDocumento: z.enum(["cpf", "cnpj"]).optional(),
  documento: z.string().optional(),
  nomeResponsavel: z.string().min(3, "Nome do responsável obrigatório"),
  emailContato: z.string().email("E-mail de contato inválido"),
  telefone: z.string().optional(),

  // Plano SaaS — CORRIGIDO: sem required_error
  planoSaaS: z.enum(["basico", "pro", "enterprise"], {
    message: "Plano SaaS obrigatório (basico, pro ou enterprise)",
  }),

  valorPlanoMensal: z.number().positive("Valor do plano deve ser positivo"),

  // Valores dos alunos
  valorMensalidadeFutebol: z.number().positive("Mensalidade do futebol obrigatória"),
  valorMensalidadeCrossfit: z.number().positive().optional(),
  valorAulaExtraPadrao: z.number().positive().optional(),
  diaVencimento: z.number().int().min(1).max(31, "Dia de vencimento deve ser entre 1 e 31"),

  // Módulos
  aulasExtrasAtivas: z.boolean().optional(),
  crossfitAtivo: z.boolean().optional(),

  // Dados do ADMIN inicial
  adminEmail: z.string().email("E-mail do admin obrigatório"),
  adminName: z.string().min(3, "Nome do admin obrigatório"),
  adminPassword: z.string().min(6, "Senha do admin deve ter no mínimo 6 caracteres"),
});

export type CreateEscolinhaDto = z.infer<typeof createEscolinhaSchema>;