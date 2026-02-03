import cron from 'node-cron';
import { prisma } from '../config/database';
import { pagamentosCrossfitController } from '../controllers/tenant/pagamentos-crossfit.controller';
import { saasPagamentoService } from '../services/superadmin/saas-pagamento.service';

// Roda todo dia às 00:05 (5 minutos depois da meia-noite)
//pagaento Saas Escolinhas
cron.schedule('0 3 1 * *', async () => {  // Todo dia 1 às 03:00
  console.log('[CRON SAAS AUTO] Iniciando geração mensal de cobranças SaaS');
  try {
    const result = await saasPagamentoService.generateAutomatic();
    console.log('[CRON SAAS AUTO] Sucesso:', result);
  } catch (err) {
    console.error('[CRON SAAS AUTO ERROR]', err);
  }
}, {
  timezone: "America/Sao_Paulo"
});

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