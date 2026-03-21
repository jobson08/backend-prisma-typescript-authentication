// src/routes/tenant/uploadImagens.routes.ts
import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../server';
import { authMiddleware, roleGuard } from '../middleware/auth.middleware';
import { tenantGuard } from '../middleware/tenant.middleware';
// Tipo estendido (alternativa inline)
interface CustomRequest extends Request {
  escolinhaId?: string;
}

const router = Router();

// Configuração do multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
fileFilter: (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(null, false); // ← null + false = rejeita sem erro explícito
  }
  cb(null, true);
},
});

// Função auxiliar para gerar URL
const saveFileAndGetUrl = async (file: Express.Multer.File, entity: string, id: string) => {
  const filename = file.filename;
  const url = `/uploads/${filename}`; // ajuste para URL pública ou CDN

  return url;
};

// Rota genérica
router.post(
  '/upload/:entity/:id?',
  authMiddleware,
  tenantGuard,
  roleGuard('ADMIN'),
  upload.single('file'),
  async (req: CustomRequest, res: Response) => {
    try {
      const { entity, id } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      const url = await saveFileAndGetUrl(file, entity, id || req.escolinhaId!);

      // Atualiza entidade (exemplos)
      if (entity === 'aluno-futebol' && id) {
        await prisma.alunoFutebol.update({
          where: { id },
          data: { fotoUrl: url },
        });
      } else if (entity === 'escolinha' && !id) {
        await prisma.escolinha.update({
          where: { id: req.escolinhaId! },
          data: { logoUrl: url },
        });
      } else if (entity === 'crossfit-banner' && !id) {
        await prisma.escolinha.update({
          where: { id: req.escolinhaId! },
          data: { crossfitBannerUrl: url },
        });
      }

      return res.json({ success: true, url });
    } catch (err: any) {
      console.error('[UPLOAD IMAGEM ERROR]', err);
      return res.status(500).json({ error: 'Erro ao fazer upload' });
    }
  }
);

export default router;