import express from 'express';
import Session from '../models/Session.js';
import Attendance from '../models/Attendance.js';
import { isHoliday } from '../utils/brazilianHolidays.js';

const router = express.Router();

function getFridaysOfMonth(year, month) {
  const fridays = [];
  const d = new Date(Date.UTC(year, month - 1, 1));
  while (d.getUTCDay() !== 5) d.setUTCDate(d.getUTCDate() + 1);
  while (d.getUTCMonth() === month - 1) {
    fridays.push(new Date(d));
    d.setUTCDate(d.getUTCDate() + 7);
  }
  return fridays;
}

function toDateStr(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// GET /api/sessions?month=6&year=2026
router.get('/', async (req, res) => {
  try {
    const month = parseInt(req.query.month, 10);
    const year = parseInt(req.query.year, 10);
    if (!month || !year) {
      return res.status(400).json({ error: 'month e year são obrigatórios' });
    }

    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const sessions = await Session.find({
      dateStr: { $regex: `^${prefix}` },
    }).sort({ dateStr: 1 });

    // Attach attendance count to each session
    const ids = sessions.map((s) => s._id);
    const counts = await Attendance.aggregate([
      { $match: { session: { $in: ids } } },
      { $group: { _id: '$session', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));

    const result = sessions.map((s) => ({
      ...s.toJSON(),
      attendanceCount: countMap[s._id.toString()] ?? 0,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sessions/next — próxima sexta-feira não cancelada
router.get('/next', async (req, res) => {
  try {
    const todayStr = toDateStr(new Date());
    const session = await Session.findOne({
      dateStr: { $gte: todayStr },
      isCancelled: false,
    }).sort({ dateStr: 1 });
    res.json(session ?? null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sessions/generate — gerar todas as sextas de um mês
router.post('/generate', async (req, res) => {
  try {
    const month = parseInt(req.body.month, 10);
    const year = parseInt(req.body.year, 10);
    if (!month || !year) {
      return res.status(400).json({ error: 'month e year são obrigatórios' });
    }

    const fridays = getFridaysOfMonth(year, month);
    const results = [];

    for (const friday of fridays) {
      const dateStr = toDateStr(friday);
      let session = await Session.findOne({ dateStr });
      if (!session) {
        const holidayInfo = isHoliday(dateStr);
        session = await Session.create({
          dateStr,
          date: new Date(`${dateStr}T12:00:00.000Z`),
          isHoliday: !!holidayInfo,
          holidayName: holidayInfo?.name ?? '',
        });
      }
      results.push(session);
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sessions/ensure — retorna ou cria sessão para uma data
router.post('/ensure', async (req, res) => {
  try {
    const { date } = req.body; // 'YYYY-MM-DD'
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'date (YYYY-MM-DD) é obrigatório' });
    }

    let session = await Session.findOne({ dateStr: date });
    if (!session) {
      const holidayInfo = isHoliday(date);
      session = await Session.create({
        dateStr: date,
        date: new Date(`${date}T12:00:00.000Z`),
        isHoliday: !!holidayInfo,
        holidayName: holidayInfo?.name ?? '',
      });
    }

    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sessions/:id
router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Sessão não encontrada' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/sessions/:id
router.patch('/:id', async (req, res) => {
  try {
    const allowed = ['isCancelled', 'cancelReason', 'notes', 'maxPlayers', 'hourlyRate'];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }

    const session = await Session.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!session) return res.status(404).json({ error: 'Sessão não encontrada' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
