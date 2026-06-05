import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 10000,
});

// ─── Sessions ────────────────────────────────────────────────────────────────
export const getSessions = (month, year) =>
  api.get('/api/sessions', { params: { month, year } }).then((r) => r.data);

export const getNextSession = () =>
  api.get('/api/sessions/next').then((r) => r.data);

export const generateSessions = (month, year) =>
  api.post('/api/sessions/generate', { month, year }).then((r) => r.data);

export const ensureSession = (date) =>
  api.post('/api/sessions/ensure', { date }).then((r) => r.data);

export const getSession = (id) =>
  api.get(`/api/sessions/${id}`).then((r) => r.data);

export const updateSession = (id, data) =>
  api.patch(`/api/sessions/${id}`, data).then((r) => r.data);

// ─── Attendance ───────────────────────────────────────────────────────────────
export const getAttendance = (sessionId) =>
  api.get('/api/attendance', { params: { sessionId } }).then((r) => r.data);

export const getAvulsoSummary = (month, year) =>
  api.get('/api/attendance/avulso-summary', { params: { month, year } }).then((r) => r.data);

export const addAttendance = (data) =>
  api.post('/api/attendance', data).then((r) => r.data);

export const updateAttendance = (id, data) =>
  api.patch(`/api/attendance/${id}`, data).then((r) => r.data);

export const removeAttendance = (id) =>
  api.delete(`/api/attendance/${id}`).then((r) => r.data);

export const uploadAttendanceComprovante = (id, file) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post(`/api/attendance/${id}/comprovante`, fd, { timeout: 60000 }).then((r) => r.data);
};

export const deleteAttendanceComprovante = (id) =>
  api.delete(`/api/attendance/${id}/comprovante`).then((r) => r.data);

// ─── Monthly Members ─────────────────────────────────────────────────────────
export const getMonthlyMembers = (month, year) =>
  api.get('/api/monthly-members', { params: { month, year } }).then((r) => r.data);

export const addMonthlyMember = (data) =>
  api.post('/api/monthly-members', data).then((r) => r.data);

export const updateMonthlyMember = (id, data) =>
  api.patch(`/api/monthly-members/${id}`, data).then((r) => r.data);

export const removeMonthlyMember = (id) =>
  api.delete(`/api/monthly-members/${id}`).then((r) => r.data);

export const uploadMemberComprovante = (id, file) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post(`/api/monthly-members/${id}/comprovante`, fd, { timeout: 60000 }).then((r) => r.data);
};

export const deleteMemberComprovante = (id) =>
  api.delete(`/api/monthly-members/${id}/comprovante`).then((r) => r.data);

// ─── Payment Receipts ─────────────────────────────────────────────────────────
export const uploadReceipt = (formData) =>
  api.post('/api/uploads', formData).then((r) => r.data);

export const getReceipts = (type) =>
  api.get('/api/uploads', { params: type ? { type } : {} }).then((r) => r.data);

export const deleteReceipt = (id) =>
  api.delete(`/api/uploads/${id}`).then((r) => r.data);

export const getHighlights = () =>
  api.get('/api/highlights').then((r) => r.data);

export const addHighlight = (formData) =>
  api.post('/api/highlights', formData).then((r) => r.data);

export const editHighlight = (id, data) =>
  api.patch(`/api/highlights/${id}`, data).then((r) => r.data);

export const deleteHighlight = (id) =>
  api.delete(`/api/highlights/${id}`).then((r) => r.data);

export default api;
