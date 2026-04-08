// src/routes/tenant/uploadImagens.routes.ts
import { Router } from 'express';
import multer from 'multer';
import { prisma } from '../server';
import { authMiddleware, roleGuard } from '../middleware/auth.middleware';
import { tenantGuard } from '../middleware/tenant.middleware';
import cloudinary from '../config/cloudinary';

const router = Router();

// Configuração do multer
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(null, false);
    }
    cb(null, true);
  },
});

// ==================== UPLOAD ====================
router.post(
  '/upload/:entity/:id?',
  authMiddleware,
  tenantGuard,
  roleGuard('ADMIN'),
  upload.single('file'),
  async (req, res) => {
    try {
      const { entity, id } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      let folderPath = `edupay/${entity}`;

      // Organização especial para alunos
      if (entity === 'aluno-futebol' && id) {
        folderPath = `edupay/${req.escolinhaId}/aluno-futebol`;        // ← Alterado aqui
      } else if (entity === 'aluno-crossfit' && id) {
        folderPath = `edupay/${req.escolinhaId}/aluno-crossfit`;
      } else if (entity === 'escolinha' && !id) {
        folderPath = `edupay/${req.escolinhaId}/escolinha`;
      } else if (entity === 'crossfit-banner' && !id) {
        folderPath = `edupay/${req.escolinhaId}/crossfit-banner`;
      }

      console.log(`[UPLOAD] Usando pasta: ${folderPath}`);

      const result = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        {
          folder: folderPath,
          transformation: [{ width: 800, height: 800, crop: 'limit' }],
        }
      );

      const url = result.secure_url;

      // Atualiza banco
      if (entity === 'escolinha' && !id) {
        await prisma.escolinha.update({
          where: { id: req.escolinhaId! },
          data: { logoUrl: url },
        });
      } else if (entity === 'crossfit-banner' && !id) {
        await prisma.escolinha.update({
          where: { id: req.escolinhaId! },
          data: { crossfitBannerUrl: url },
        });
      } else if (entity === 'aluno-futebol' && id) {
        await prisma.alunoFutebol.update({
          where: { id },
          data: { fotoUrl: url },
        });
      } else if (entity === 'aluno-crossfit' && id) {
        await prisma.alunoCrossfit.update({
          where: { id },
          data: { fotoUrl: url },
        });
      }

      return res.json({ success: true, url });
    } catch (err: any) {
      console.error('[UPLOAD ERROR]', err);
      return res.status(500).json({ error: 'Erro ao fazer upload' });
    }
  }
);

// ==================== DELETE ====================
router.delete(
  '/upload/:entity/:id?',
  authMiddleware,
  tenantGuard,
  roleGuard('ADMIN'),
  async (req, res) => {
    try {
      const { entity, id } = req.params;
      const { publicId } = req.body;

      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
        console.log(`[CLOUDINARY] Imagem deletada: ${publicId}`);
      }

      // Limpa a URL no banco
      if (entity === 'escolinha' && !id) {
        await prisma.escolinha.update({
          where: { id: req.escolinhaId! },
          data: { logoUrl: null },
        });
      } else if (entity === 'crossfit-banner' && !id) {
        await prisma.escolinha.update({
          where: { id: req.escolinhaId! },
          data: { crossfitBannerUrl: null },
        });
      } else if (entity === 'aluno-futebol' && id) {
        await prisma.alunoFutebol.update({
          where: { id },
          data: { fotoUrl: null },
        });
      } else if (entity === 'aluno-crossfit' && id) {
        await prisma.alunoCrossfit.update({
          where: { id },
          data: { fotoUrl: null },
        });
      }

      return res.json({ success: true, message: 'Imagem removida com sucesso' });
    } catch (err: any) {
      console.error('[DELETE IMAGE ERROR]', err);
      return res.status(500).json({ error: 'Erro ao deletar imagem' });
    }
  }
);

export default router;