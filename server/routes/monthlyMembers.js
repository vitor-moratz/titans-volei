import express from 'express';
import multer from 'multer';
import MonthlyMember from '../models/MonthlyMember.js';
import Payment from '../models/Payment.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/monthly-members?month=6&year=2026
router.get('/', async (req, res) => {
  try {
    const month = parseInt(req.query.month, 10);
    const year = parseInt(req.query.year, 10);
    if (!month || !year) {
      return res.status(400).json({ error: 'month e year são obrigatórios' });
    }

    const members = await MonthlyMember.find({ month, year }).sort({ createdAt: 1 });
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/monthly-members
router.post('/', async (req, res) => {
  try {
    const { name, month, year, notes } = req.body;
    if (!name || !month || !year) {
      return res.status(400).json({ error: 'name, month e year são obrigatórios' });
    }

    const member = await MonthlyMember.create({
      name: name.trim(),
      month: parseInt(month, 10),
      year: parseInt(year, 10),
      notes: notes?.trim() ?? '',
    });

    res.status(201).json(member);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: `"${req.body.name}" já está na lista deste mês.` });
    }
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/monthly-members/:id
router.patch('/:id', async (req, res) => {
  try {
    const { hasPaid, notes, name } = req.body;
    const update = {};
    if (hasPaid !== undefined) {
      update.hasPaid = hasPaid;
      update.paidAt = hasPaid ? new Date() : null;
    }
    if (notes !== undefined) update.notes = notes.trim();
    if (name !== undefined) update.name = name.trim();

    const member = await MonthlyMember.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!member) return res.status(404).json({ error: 'Membro não encontrado' });
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/monthly-members/:id
router.delete('/:id', async (req, res) => {
  try {
    const member = await MonthlyMember.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ error: 'Membro não encontrado' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// POST /api/monthly-members/:id/comprovante
router.post('/:id/comprovante', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Arquivo nao enviado' });
    const member = await MonthlyMember.findById(req.params.id);
    if (!member) return res.status(404).json({ error: 'Membro nao encontrado' });

    // Remove comprovante anterior do Cloudinary e do Payment
    if (member.comprovanteId) {
      await deleteFromCloudinary(member.comprovanteId, 'image').catch(() => {});
    }
    if (member.comprovantePaymentId) {
      await Payment.findByIdAndDelete(member.comprovantePaymentId).catch(() => {});
    }

    const isPdf = req.file.mimetype === 'application/pdf';
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'titans-volei/receipts',
      resource_type: isPdf ? 'raw' : 'image',
    });

    // Cria registro no Payment (aparece em Comprovantes)
    const payment = await Payment.create({
      type: 'mensalista',
      playerName: member.name,
      month: member.month,
      year: member.year,
      fileName: req.file.originalname,
      filePath: result.secure_url,
      cloudinaryId: result.public_id,
      mimeType: req.file.mimetype,
    });

    member.comprovantePath      = result.secure_url;
    member.comprovanteId        = result.public_id;
    member.comprovantePaymentId = payment._id.toString();
    await member.save();
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/monthly-members/:id/comprovante
router.delete('/:id/comprovante', async (req, res) => {
  try {
    const member = await MonthlyMember.findById(req.params.id);
    if (!member) return res.status(404).json({ error: 'Membro nao encontrado' });
    if (member.comprovanteId) {
      await deleteFromCloudinary(member.comprovanteId, 'image').catch(() => {});
    }
    if (member.comprovantePaymentId) {
      await Payment.findByIdAndDelete(member.comprovantePaymentId).catch(() => {});
    }
    member.comprovantePath      = null;
    member.comprovanteId        = null;
    member.comprovantePaymentId = null;
    await member.save();
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
