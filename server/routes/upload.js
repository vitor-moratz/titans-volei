import express from 'express';
import multer from 'multer';
import Payment from '../models/Payment.js';
import MonthlyMember from '../models/MonthlyMember.js';
import Attendance from '../models/Attendance.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

const router = express.Router();

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE_MB = 10;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Tipo de arquivo nao permitido. Use JPG, PNG, WEBP ou PDF.'));
  },
});

// POST /api/uploads
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { type = 'mensalista', playerName, month, year } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Arquivo e obrigatorio.' });
    if (!['mensalista', 'quadra'].includes(type)) return res.status(400).json({ error: 'Tipo invalido.' });
    if (!month || !year) return res.status(400).json({ error: 'Mes e ano sao obrigatorios.' });
    if (type === 'mensalista' && !playerName?.trim()) return res.status(400).json({ error: 'Nome do mensalista e obrigatorio.' });

    const isPdf = req.file.mimetype === 'application/pdf';
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'titans-volei/receipts',
      resource_type: isPdf ? 'raw' : 'image',
    });

    const payment = await Payment.create({
      type,
      playerName: type === 'mensalista' ? playerName.trim() : '',
      month,
      year: Number(year),
      fileName: req.file.originalname,
      filePath: result.secure_url,
      cloudinaryId: result.public_id,
      mimeType: req.file.mimetype,
    });
    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/uploads
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    const payments = await Payment.find(filter).sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/uploads/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!['pendente', 'confirmado', 'rejeitado'].includes(status)) {
      return res.status(400).json({ error: 'Status invalido.' });
    }
    const payment = await Payment.findByIdAndUpdate(req.params.id, { status, notes }, { new: true });
    if (!payment) return res.status(404).json({ error: 'Registro nao encontrado.' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/uploads/:id
router.delete('/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Comprovante nao encontrado.' });
    if (payment.cloudinaryId) {
      const isPdf = payment.mimeType === 'application/pdf';
      await deleteFromCloudinary(payment.cloudinaryId, isPdf ? 'raw' : 'image');
    }
    await Payment.findByIdAndDelete(req.params.id);

    // Limpar comprovante no MonthlyMember correspondente (se houver)
    await MonthlyMember.updateOne(
      { comprovantePaymentId: req.params.id },
      { $set: { comprovantePath: null, comprovanteId: null, comprovantePaymentId: null } }
    ).catch(() => {});

    // Limpar comprovante no Attendance correspondente (se houver)
    await Attendance.updateOne(
      { comprovantePaymentId: req.params.id },
      { $set: { comprovantePath: null, comprovanteId: null, comprovantePaymentId: null } }
    ).catch(() => {});

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
