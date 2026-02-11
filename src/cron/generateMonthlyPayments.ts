import cron from 'node-cron';
import { prisma } from '../config/database';
import { pagamentosCrossfitController } from '../controllers/tenant/pagamentos-crossfit.controller';
import { pagamentosFutebolController } from '../controllers/tenant/pagamentos-futebol.controller'; // ← novo controller
import { saasPagamentoService } from '../services/superadmin/saas-pagamento.service';

// Configuração de timezone padrão para todos os jobs
const TIMEZONE = "America/Sao_Paulo";

// 1. Cobrança SaaS das Escolinhas
// Todo dia 1 às 03:00
cron.schedule('0 3 1 * *', async () => {
  console.log('[CRON] Iniciando geração mensal de cobranças SaaS');
  try {
    const result = await saasPagamentoService.generateAutomatic();
    console.log('[CRON SAAS] Sucesso:', result);
  } catch (err) {
    console.error('[CRON SAAS ERROR]', err);
  }
}, { timezone: TIMEZONE });

// 2. Geração automática de mensalidades CrossFit
// Todo dia 1 às 00:05
cron.schedule('5 0 1 * *', async () => {
  console.log('[CRON] Iniciando geração automática de mensalidades CrossFit...');
  try {
    // Simula req e res para chamar o controller
    const mockReq = { body: {} } as any;
    const mockRes = {
      json: (data: any) => console.log('[CRON CROSSFIT]', data),
      status: (code: number) => ({ json: (err: any) => console.error('[CRON CROSSFIT ERROR]', err) }),
    } as any;

    await pagamentosCrossfitController.generateAutomatic(mockReq, mockRes);
    console.log('[CRON CROSSFIT] Geração concluída.');
  } catch (err) {
    console.error('[CRON CROSSFIT ERROR]', err);
  }
}, { timezone: TIMEZONE });

// 3. Geração automática de mensalidades Futebol (novo)
// Todo dia 1 às 00:10 (depois do CrossFit para evitar sobrecarga simultânea)
cron.schedule('10 0 1 * *', async () => {
  console.log('[CRON] Iniciando geração automática de mensalidades Futebol...');
  try {
    const mockReq = { body: {} } as any;
    const mockRes = {
      json: (data: any) => console.log('[CRON FUTEBOL]', data),
      status: (code: number) => ({ json: (err: any) => console.error('[CRON FUTEBOL ERROR]', err) }),
    } as any;

    await pagamentosFutebolController.generateAutomatic(mockReq, mockRes);
    console.log('[CRON FUTEBOL] Geração concluída.');
  } catch (err) {
    console.error('[CRON FUTEBOL ERROR]', err);
  }
}, { timezone: "America/Sao_Paulo" });

// Opcional: Log de inicialização do cron
console.log('[CRON] Jobs de pagamentos iniciados com sucesso (SaaS, CrossFit e Futebol)');