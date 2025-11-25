// src/seeds/super-admin.seed.ts
import { prisma } from '../config/database';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const email = process.env.SUPERADMIN_EMAIL!;
const password = process.env.SUPERADMIN_PASSWORD!;
const name = process.env.SUPERADMIN_NAME!;

if (!email || !password || !name) {
  console.error('Variáveis do Super Admin não definidas no .env');
  process.exit(1);
}

async function createSuperAdmin() {
  const email = 'superadmin@escolinha.com';
  const password = '35182982'; // ← depois você muda isso no .env
  const name = 'Super Admin';

  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    const superAdmin = await prisma.usuario.upsert({
      where: { email },
      update: {
        // Se já existir, só atualiza a senha (útil em dev)
        password: hashedPassword,
        name,
      },
      create: {
        email,
        password: hashedPassword,
        name,
        role: 'SUPER_ADMIN',
        tenantId: null, // Super Admin não pertence a nenhum tenant
        img: null,
      },
    });

    console.log('SUPER_ADMIN garantido com sucesso!');
    console.log(`Email: ${superAdmin.email}`);
    console.log(`Nome: ${superAdmin.name}`);
    console.log(`ID: ${superAdmin.id}`);
    console.log(`Role: ${superAdmin.role}`);
    console.log('');
    console.log('Agora faça login e crie seu primeiro tenant!');
  } catch (error: any) {
    console.error('ERRO ao criar Super Admin:');
    console.error(error.message || error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// RODA AUTOMATICAMENTE
createSuperAdmin();

//comando para criar o super admin (npx tsx src/seeds/super-admin.seed.ts)


/*async function createSuperAdmin() {
  const email = 'superadmin@escolinha.com';
  const password = '35182982';
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
  */