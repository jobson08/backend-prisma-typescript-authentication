// src/dtos/pagamento-futebol.dto.ts
import { z } from 'zod';

// Schema para criação manual (igual ao do CrossFit)
export const createManualMensalidadeFutebolSchema = z.object({
  mesReferencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD'),
  dataVencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD'),
  valor: z.number().positive('Valor deve ser maior que zero'),
  observacao: z.string().optional(),
});

// Tipo inferido para uso no controller/service
export type CreateManualMensalidadeFutebolInput = z.infer<typeof createManualMensalidadeFutebolSchema>;