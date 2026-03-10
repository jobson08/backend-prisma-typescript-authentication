// src/controllers/tenant/escolinha-config.controller.ts
import { Request, Response } from 'express';
import { escolinhaConfigService } from '../../services/tenant/escolinha-config.service';
import { z } from 'zod';
import { CrossfitConfigInput } from '../../types/escolinha-config';

const geralSchema = z.object({
  nome: z.string().min(3),
  mensagemBoasVindas: z.string().optional(),
});

const aulasExtrasSchema = z.object({
  ativarAulasExtras: z.boolean(),
});

const crossfitSchema = z.object({
  ativarCrossfit: z.boolean(),
  mostrarNavbar: z.boolean(),
  mostrarSidebar: z.boolean(),
});

const pagamentosSchema = z.object({
  gateway: z.enum(["stripe", "pagseguro", "pix", "nenhum"]),
  stripePublishableKey: z.string().optional(),
  stripeSecretKey: z.string().optional(),
  pagseguroEmail: z.string().email().optional(),
  pagseguroToken: z.string().optional(),
  pixChave: z.string().optional(),
  pixNomeTitular: z.string().optional(),
  pixBanco: z.string().optional(),
});

export class EscolinhaConfigController {
async getConfig(req: Request, res: Response) {
  try {
    const escolinhaId = req.escolinhaId!;
   // console.log('[GET CONFIG] Buscando para escolinhaId:', escolinhaId);

    const config = await escolinhaConfigService.getConfig(escolinhaId);

   // console.log('[GET CONFIG] Dados retornados:', config);

    return res.json({ success: true, data: config });
  } catch (error: any) {
    console.error('[GET CONFIG ERROR]', {
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      error: 'Erro ao carregar configurações',
      message: error.message || 'Erro interno',
    });
  }
}

  async updateGeral(req: Request, res: Response) {
    try {
      const escolinhaId = req.escolinhaId!;
      const data = geralSchema.parse(req.body);
      const result = await escolinhaConfigService.updateGeral(escolinhaId, data);
      return res.json({ success: true, message: 'Configurações gerais atualizadas', data: result });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
      }
      return res.status(500).json({ error: 'Erro ao atualizar configurações gerais' });
    }
  }

  async updateAulasExtras(req: Request, res: Response) {
    try {
      const escolinhaId = req.escolinhaId!;

      console.log('[CONTROLLER] Payload recebido (Aulas Extras):', req.body);

      const data = aulasExtrasSchema.parse(req.body);

      console.log('[CONTROLLER] Dados validados (Aulas Extras):', data);

      const result = await escolinhaConfigService.updateAulasExtras(escolinhaId, data);

      return res.json({
        success: true,
        message: 'Configurações de Aulas Extras atualizadas',
        data: result,
      });
    } catch (error: any) {
      console.error('[UPDATE AULAS EXTRAS ERROR]', {
        message: error.message,
        stack: error.stack,
        body: req.body,
      });

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: error.issues,
        });
      }

      return res.status(500).json({
        error: 'Erro interno ao atualizar Aulas Extras',
        message: error.message || 'Erro desconhecido',
      });
    }
  }

 async updateCrossfit(req: Request, res: Response) {
    try {
      const escolinhaId = req.escolinhaId!;

      // Log do payload cru
      console.log('[CONTROLLER] Payload recebido:', req.body);

      const data = crossfitSchema.parse(req.body);

      // Log após validação
      console.log('[CONTROLLER] Dados validados:', data);

      const result = await escolinhaConfigService.updateCrossfit(escolinhaId, data);

      return res.json({
        success: true,
        message: 'Configurações CrossFit atualizadas',
        data: result,
      });
    } catch (error: any) {
      console.error('[UPDATE CROSSFIT ERROR]', {
        message: error.message,
        stack: error.stack,
        body: req.body,
      });

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: error.issues,
        });
      }

      return res.status(500).json({
        error: 'Erro interno ao atualizar CrossFit',
        message: error.message || 'Erro desconhecido',
      });
    }
  }

  async updatePagamentos(req: Request, res: Response) {
    try {
      const escolinhaId = req.escolinhaId!;
      const data = pagamentosSchema.parse(req.body);
      const result = await escolinhaConfigService.updatePagamentos(escolinhaId, data);
      return res.json({ success: true, message: 'Configurações de pagamento atualizadas', data: result });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Upload de logo
  async uploadLogo(req: Request, res: Response) {
    try {
      const escolinhaId = req.escolinhaId!;
      const file = req.file;
      if (!file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

      const result = await escolinhaConfigService.uploadLogo(escolinhaId, file);
      return res.json({ success: true, message: 'Logo atualizada', data: result });
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro ao fazer upload da logo' });
    }
  }

  // Upload de banner do CrossFit
  async uploadCrossfitBanner(req: Request, res: Response) {
    try {
      const escolinhaId = req.escolinhaId!;
      const file = req.file;
      if (!file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

      const result = await escolinhaConfigService.uploadCrossfitBanner(escolinhaId, file);
      return res.json({ success: true, message: 'Banner do CrossFit atualizado', data: result });
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro ao fazer upload do banner' });
    }
  }
}

export const escolinhaConfigController = new EscolinhaConfigController();