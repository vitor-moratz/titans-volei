import express from 'express';
import multer from 'multer';
import Attendance from '../models/Attendance.js';
import Payment from '../models/Payment.js';
import Session from '../models/Session.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/attendance/avulso-summary?month=6&year=2026
router.get('/avulso-summary', async (req, res) => {
  try {
    const month = parseInt(req.query.month, 10);
    const year  = parseInt(req.query.year,  10);
    if (!month || !year) return res.status(400).json({ error: 'month e year são obrigatórios' });

    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const sessions = await Session.find({ dateStr: { $regex: `^${prefix}` } }).select('_id dateStr');
    const sessionIds = sessions.map((s) => s._id);

    const avulsos = await Attendance.find({
      session: { $in: sessionIds },
      paymentType: 'avulso',
      isSubstitute: { $ne: true },
    }).populate('session', 'dateStr');

    const bySession = sessions.map((s) => {
      const count = avulsos.filter((a) => String(a.session._id) === String(s._id)).length;
      return { dateStr: s.dateStr, count };
    }).filter((s) => s.count > 0);

    res.json({
      avulsoCount: avulsos.length,
      paidCount: avulsos.filter((a) => a.hasPaid).length,
      unpaidCount: avulsos.filter((a) => !a.hasPaid).length,
      bySession,
      players: avulsos.map((a) => ({ playerName: a.playerName, dateStr: a.session.dateStr, hasPaid: a.hasPaid })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/attendance?sessionId=xxx
router.get('/', async (req, res) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) return res.status(400).json({ error: 'sessionId é obrigatório' });

    const list = await Attendance.find({ session: sessionId }).sort({ createdAt: 1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/attendance
router.post('/', async (req, res) => {
  try {
    const { sessionId, playerName, paymentType, isSubstitute, substituteFor } = req.body;

    if (!sessionId || !playerName) {
      return res.status(400).json({ error: 'sessionId e playerName são obrigatórios' });
    }

    const entry = await Attendance.create({
      session: sessionId,
      playerName: playerName.trim(),
      paymentType: paymentType || 'mensal',
      isSubstitute: !!isSubstitute,
      substituteFor: isSubstitute ? (substituteFor || '').trim() : '',
    });

    res.status(201).json(entry);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: `"${req.body.playerName}" já está na lista.` });
    }
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/attendance/:id
router.patch('/:id', async (req, res) => {
  try {
    const allowed = ['playerName', 'paymentType', 'isSubstitute', 'substituteFor', 'hasPaid'];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }

    const entry = await Attendance.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!entry) return res.status(404).json({ error: 'Registro não encontrado' });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/attendance/:id
router.delete('/:id', async (req, res) => {
  try {
    const entry = await Attendance.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Registro não encontrado' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// POST /api/attendance/:id/comprovante
router.post('/:id/comprovante', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Arquivo nao enviado' });
    const record = await Attendance.findById(req.params.id).populate('session', 'dateStr');
    if (!record) return res.status(404).json({ error: 'Presenca nao encontrada' });

    if (record.comprovanteId) {
      await deleteFromCloudinary(record.comprovanteId, 'image').catch(() => {});
    }
    if (record.comprovantePaymentId) {
      await Payment.findByIdAndDelete(record.comprovantePaymentId).catch(() => {});
    }

    const isPdf = req.file.mimetype === 'application/pdf';
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'titans-volei/receipts',
      resource_type: isPdf ? 'raw' : 'image',
    });

    // Extrair mes/ano da sessao para criar Payment
    const dateStr = record.session?.dateStr ?? '';
    const [yearStr, monthStr] = dateStr.split('-');
    const month = parseInt(monthStr, 10) || new Date().getMonth() + 1;
    const year  = parseInt(yearStr,  10) || new Date().getFullYear();

    const payment = await Payment.create({
      type: 'mensalista',
      playerName: record.playerName,
      month,
      year,
      fileName: req.file.originalname,
      filePath: result.secure_url,
      cloudinaryId: result.public_id,
      mimeType: req.file.mimetype,
    });

    record.comprovantePath      = result.secure_url;
    record.comprovanteId        = result.public_id;
    record.comprovantePaymentId = payment._id.toString();
    await record.save();
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/attendance/:id/comprovante
router.delete('/:id/comprovante', async (req, res) => {
  try {
    const record = await Attendance.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Presenca nao encontrada' });
    if (record.comprovanteId) {
      await deleteFromCloudinary(record.comprovanteId, 'image').catch(() => {});
    }
    if (record.comprovantePaymentId) {
      await Payment.findByIdAndDelete(record.comprovantePaymentId).catch(() => {});
    }
    record.comprovantePath      = null;
    record.comprovanteId        = null;
    record.comprovantePaymentId = null;
    await record.save();
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
