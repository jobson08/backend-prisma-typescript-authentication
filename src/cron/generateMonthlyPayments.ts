import cron from 'node-cron';
import { prisma } from '../config/database';
import { pagamentosCrossfitController } from '../controllers/tenant/pagamentos-crossfit.controller';

// Roda todo dia às 00:05 (5 minutos depois da meia-noite)
cron.schedule('5 0 * * *', async () => {
  console.log('[CRON] Iniciando geração de pagamentos mensais SaaS...');

  try {
    const hoje = new Date();
    const diaAtual = hoje.getDate();

    const escolinhasVencendoHoje = await prisma.escolinha.findMany({
      where: {
        statusPagamentoSaaS: 'ativo',
        diaVencimento: diaAtual,
      },
      select: {
        id: true,
        nome: true,
        valorPlanoMensal: true,
        dataProximoCobranca: true,
      },
    });

    if (escolinhasVencendoHoje.length === 0) {
      console.log('[CRON] Nenhuma cobrança para hoje.');
      return;
    }

    console.log(`[CRON] Gerando ${escolinhasVencendoHoje.length} cobranças...`);

    for (const e of escolinhasVencendoHoje) {
      await prisma.pagamento.create({
        data: {
          escolinhaId: e.id,
          valor: e.valorPlanoMensal,
          dataVencimento: hoje,
          tipo: 'saas',
          status: 'PENDENTE',
          referenciaId: `saas-${e.id}-${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`,
        },
      });

      // Atualiza o próximo vencimento (próximo mês, mesmo dia)
      const proximo = new Date(hoje);
      proximo.setMonth(proximo.getMonth() + 1);
      await prisma.escolinha.update({
        where: { id: e.id },
        data: { dataProximoCobranca: proximo },
      });

      console.log(`[CRON] Cobrança gerada para escolinha ${e.nome} (ID: ${e.id})`);
    }

    console.log('[CRON] Geração concluída!');
  } catch (error) {
    console.error('[CRON] Erro ao gerar pagamentos:', error);
  }
}, {
  timezone: 'America/Sao_Paulo' // só isso (sem scheduled)
});

console.log('[Cron] Gerador mensal de pagamentos SaaS iniciado');

//pagamento Aluno Croassfit
// Roda todo dia 1º do mês às 00:05
cron.schedule('5 0 1 * *', async () => {
  console.log('Iniciando geração automática de mensalidades CrossFit...');
  try {
    await pagamentosCrossfitController.generateAutomatic(
      { body: {} } as any, // simula req sem body
      { json: console.log, status: console.log } as any // simula res
    );
    console.log('Geração automática concluída.');
  } catch (err) {
    console.error('Erro na geração automática:', err);
  }
});