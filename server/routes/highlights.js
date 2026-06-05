import express from 'express';
import multer from 'multer';
import Highlight from '../models/Highlight.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('video/')) return cb(null, true);
    cb(new Error('Apenas arquivos de video sao permitidos.'));
  },
});

// GET /api/highlights
router.get('/', async (_req, res) => {
  try {
    const highlights = await Highlight.find().sort({ date: -1, createdAt: -1 });
    res.json(highlights);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/highlights
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { title, date, description, category, playerName } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Arquivo de video e obrigatorio.' });
    if (!title?.trim() || !date) return res.status(400).json({ error: 'Titulo e data sao obrigatorios.' });

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'titans-volei/highlights',
      resource_type: 'video',
    });

    const highlight = await Highlight.create({
      title: title.trim(),
      date,
      fileName: req.file.originalname,
      filePath: result.secure_url,
      cloudinaryId: result.public_id,
      mimeType: req.file.mimetype,
      description: description?.trim() || '',
      category: ['jogada', 'comedia'].includes(category) ? category : 'jogada',
      playerName: playerName?.trim() || '',
    });
    res.status(201).json(highlight);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/highlights/:id
router.patch('/:id', async (req, res) => {
  try {
    const { title, date, description, category, playerName } = req.body;
    const updates = {};
    if (title?.trim()) updates.title = title.trim();
    if (date) updates.date = date;
    if (description !== undefined) updates.description = description.trim();
    if (category && ['jogada', 'comedia'].includes(category)) updates.category = category;
    if (playerName !== undefined) updates.playerName = playerName.trim();
    const h = await Highlight.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!h) return res.status(404).json({ error: 'Highlight nao encontrado.' });
    res.json(h);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/highlights/:id
router.delete('/:id', async (req, res) => {
  try {
    const h = await Highlight.findById(req.params.id);
    if (!h) return res.status(404).json({ error: 'Highlight nao encontrado.' });
    if (h.cloudinaryId) {
      await deleteFromCloudinary(h.cloudinaryId, 'video');
    }
    await Highlight.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
