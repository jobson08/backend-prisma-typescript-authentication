import express, { Request, Response, NextFunction, request } from 'express';
import { prisma } from './config/database';
//import dotenv from "dotenv";
//import cors from "cors";
//import morgan from "morgan";
//import helmet from 'helmet';
//import authRoutes from './modules/auth/auth.routes';
import tenantRoutes from './modules/tenant/tenat.routes';


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

//app.use('/auth', authRoutes);

app.use('/api', tenantRoutes);

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST;
app.listen (PORT, () => {
 console.log ( `Server rodando na porta http://${HOST}:${PORT}` );
});

export { prisma };