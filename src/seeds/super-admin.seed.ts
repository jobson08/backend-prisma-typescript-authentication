// src/seeds/super-admin.seed.ts
import { prisma } from '../config/database';
import bcrypt from 'bcrypt';
import 'dotenv/config';

async function createSuperAdmin() {
  const email = process.env.SUPERADMIN_EMAIL || 'superadmin@futelite.com';
  const rawPassword = process.env.SUPERADMIN_PASSWORD || '35182982';
  const name = process.env.SUPERADMIN_NAME || 'Super Admin';

  try {
    const hashedPassword = await bcrypt.hash(rawPassword, 12);

    const superAdmin = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        name,
        role: 'SUPERADMIN',
        img: null,
      },
      create: {
        email,
        password: hashedPassword,
        name,
        role: 'SUPERADMIN',
        img: null,
      },
    });

    console.log('🚀 SUPERADMIN CRIADO/GARANTIDO COM SUCESSO!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👤 Nome: ${superAdmin.name}`);
    console.log(`📧 Email: ${superAdmin.email}`);
    console.log(`🆔 ID: ${superAdmin.id}`);
    console.log(`🔑 Role: ${superAdmin.role}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Agora faça login com essas credenciais!');
    console.log('⚠️  Mude a senha no .env para produção!');
  } catch (error: any) {
    console.error('❌ ERRO AO CRIAR SUPERADMIN:');
    console.error(error.message || error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();