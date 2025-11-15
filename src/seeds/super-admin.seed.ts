// src/seeds/super-admin.seed.ts
import { prisma } from '../config/database';
import bcrypt from 'bcrypt';

async function createSuperAdmin() {
  const email = 'superadmin@escolinha.com';
  const password = 'admin2025';
  const name = 'Super Admin';

  const hashedPassword = await bcrypt.hash(password, 10);

  const superAdmin = await prisma.usuario.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: hashedPassword,
      name,
      role: 'SUPER_ADMIN',
      tenantId: null, // ← CORRETO! Prisma aceita null em campo opcional
      updatedAt: new Date(),
    } 
  });

  console.log('SUPER_ADMIN criado:');
  console.log(`Email: ${email}`);
  console.log(`Senha: ${password}`);
  console.log(`ID: ${superAdmin.id}`);
}

createSuperAdmin()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('ERRO:', e);
    process.exit(1);
  });