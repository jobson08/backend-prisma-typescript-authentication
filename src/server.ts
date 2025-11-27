import express, { Request, Response, NextFunction, request } from 'express';
import { prisma } from './config/database';
import usuarioRoutes from './routes/usuario.routes';
import authRoutes from './routes/auth.routes';
import { authMiddleware } from './middleware/auth.middleware';
import { tenantMiddleware } from './middleware/tenant.middleware';
import alunoRoutes from './routes/aluno.routes';
import tenantRoutes from './routes/tenant.routes';
import responsavelRoutes from './routes/responsavel.routes';
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

// ROTAS PROTEGIDAS (precisam de JWT + tenant)
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', authMiddleware, tenantMiddleware, usuarioRoutes);
app.use('/api/alunos', authMiddleware, tenantMiddleware, alunoRoutes);
app.use('/api/tenants', authMiddleware, tenantMiddleware, tenantRoutes);
app.use('/api/responsaveis', authMiddleware, tenantMiddleware, responsavelRoutes);
//app.use('/api/movimentacoes', authMiddleware, tenantMiddleware, movimentacaoRoutes);
//app.use('/api/mensalidades', authMiddleware, tenantMiddleware, mensalidadeRoutes);
//app.use('/api/categorias', authMiddleware, tenantMiddleware, categoriaRoutes);



const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST;
app.listen (PORT, () => {
 console.log ( `Server rodando na porta http://${HOST}:${PORT}` );
});

export { prisma };