import express, { Request, Response, NextFunction, request } from 'express';
import { prisma } from './config/database';
import authRoutes from './routes/auth.routes';
import { authMiddleware, roleGuard } from './middleware/auth.middleware';
//import dotenv from "dotenv";
//import cors from "cors";
//import morgan from "morgan";
//import helmet from 'helmet';

const app = express();

//app.use(morgan("tiny"));

/*app.use(cors({ 
    origin: ['http://localhost:400],
 })
);*/

//app.use(helmet());

app.use(express.json());

app.get('/', (req: Request, res: Response ) => {
    return res.json("Bem vindo ao sividor escolina futebol");
});

// Rotas públicas
app.use('/api/v1/auth', authRoutes);

// ROTAS PROTEGIDAS (precisam de JWT + tenant)

//app.use('/api/v1/superadmin', authMiddleware, roleGuard('SUPERADMIN'), superadminRoutes);
//app.use('/api/v1/admin', authMiddleware, roleGuard('ADMIN'), tenantGuard, adminRoutes);


const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST;
app.listen (PORT, () => {
 console.log ( `Server rodando na porta http://${HOST}:${PORT}` );
});

export { prisma };