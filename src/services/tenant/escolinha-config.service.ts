import { prisma } from '../../config/database';
import { AulasExtrasConfigInput, CrossfitConfigInput } from '../../types/escolinha-config';

export class EscolinhaConfigService {
 // src/services/tenant/escolinha-config.service.ts
async getConfig(escolinhaId: string) {
  const config = await prisma.escolinha.findUnique({
    where: { id: escolinhaId },
    select: {
      nome: true,                       // existe
      logoUrl: true,                    // existe
      crossfitAtivo: true,              // existe
      mostrarCrossfitNavbar: true,      // existe
      mostrarCrossfitSidebar: true,     // existe
      aulasExtrasAtivas: true,          // existe
      // NÃO inclua nada que não esteja no model acima
    },
  });

  if (!config) {
    throw new Error('Escolinha não encontrada');
  }

  // Retorne um objeto completo com fallbacks para os campos que o frontend espera
  return {
    ...config,
    // Campos que não existem no banco ainda (frontend vai usar esses defaults)
    mensagemBoasVindas: '',
    gatewayPagamento: 'nenhum',
    stripePublishableKey: '',
    stripeSecretKey: '',
    pagseguroEmail: '',
    pagseguroToken: '',
    pixChave: '',
    pixNomeTitular: '',
    pixBanco: '',
    crossfitBannerUrl: null,
    valorMensalidadeFutebol: 150.00,
    valorMensalidadeCrossfit: null,
    valorAulaExtraPadrao: null,
    diaVencimento: 10,
  };
}

  async updateGeral(escolinhaId: string, data: { nome: string; mensagemBoasVindas?: string }) {
    return prisma.escolinha.update({
      where: { id: escolinhaId }, 
      data: {
        nome: data.nome,
        mensagemBoasVindas: data.mensagemBoasVindas,
      },
    });
  }

  async updateAulasExtras(escolinhaId: string, data: AulasExtrasConfigInput) {
  //  console.log('[SERVICE] Atualizando Aulas Extras com:', data);

    return prisma.escolinha.update({
      where: { id: escolinhaId },
      data: {
        aulasExtrasAtivas: data.ativarAulasExtras,
      },
    });
  }

async updateCrossfit(escolinhaId: string, data: CrossfitConfigInput ) {
   // console.log('[SERVICE] Atualizando CrossFit com:', data);

    return prisma.escolinha.update({
      where: { id: escolinhaId },
      data: {
        crossfitAtivo: data.ativarCrossfit,
        mostrarCrossfitNavbar: data.mostrarNavbar,
        mostrarCrossfitSidebar: data.mostrarSidebar,
      },
    });
  }

  async updatePagamentos(escolinhaId: string, data: any) {
    return prisma.escolinha.update({
      where: { id: escolinhaId },
      data: {
        gatewayPagamento: data.gateway,
        stripePublishableKey: data.stripePublishableKey,
        stripeSecretKey: data.stripeSecretKey,
        pagseguroEmail: data.pagseguroEmail,
        pagseguroToken: data.pagseguroToken,
        pixChave: data.pixChave,
        pixNomeTitular: data.pixNomeTitular,
        pixBanco: data.pixBanco,
      },
    });
  }

  async uploadLogo(escolinhaId: string, file: Express.Multer.File) {
    if (!file) throw new Error('Nenhum arquivo enviado');
    const url = `/uploads/${file.filename}`;

    return prisma.escolinha.update({
      where: { id: escolinhaId },
      data: { logoUrl: url },
    });
  }

  async uploadCrossfitBanner(escolinhaId: string, file: Express.Multer.File) {
    if (!file) throw new Error('Nenhum arquivo enviado');
    const url = `/uploads/${file.filename}`;

    return prisma.escolinha.update({
      where: { id: escolinhaId },
      data: { crossfitBannerUrl: url },
    });
  }
}

export const escolinhaConfigService = new EscolinhaConfigService();