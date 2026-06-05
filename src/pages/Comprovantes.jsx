import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Alert,
  CircularProgress,
  Paper,
  Tabs,
  Tab,
  Chip,
  Divider,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Skeleton,
  Autocomplete,
  IconButton,
  Tooltip,
  Avatar,
} from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PersonIcon from '@mui/icons-material/Person';
import SportsVolleyballIcon from '@mui/icons-material/SportsVolleyball';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import LaunchIcon from '@mui/icons-material/Launch';
import { uploadReceipt, getReceipts, deleteReceipt, getMonthlyMembers } from '../services/api.js';
import { MONTH_NAMES } from '../utils/holidays.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getAvatarColor(name) {
  const palette = ['#1a237e', '#4a148c', '#006064', '#1b5e20', '#bf360c', '#e65100'];
  return palette[(name?.charCodeAt(0) ?? 0) % palette.length];
}

function getInitials(name) {
  return (name || '').split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase()).join('');
}

const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 1, currentYear, currentYear + 1];

const STATUS_CONFIG = {
  pendente: { label: 'Pendente', color: 'default', icon: <HourglassEmptyIcon fontSize="small" /> },
  confirmado: { label: 'Confirmado', color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
  rejeitado: { label: 'Rejeitado', color: 'error', icon: <CancelIcon fontSize="small" /> },
};

const EMPTY_FORM = { playerName: '', month: '', year: currentYear };

function UploadForm({ type, onSuccess }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [mensalistas, setMensalistas] = useState([]);

  const isMensalista = type === 'mensalista';

  useEffect(() => {
    if (!isMensalista) return;
    const monthNum = form.month ? MONTH_NAMES.indexOf(form.month) + 1 : new Date().getMonth() + 1;
    const yearNum = Number(form.year) || new Date().getFullYear();
    getMonthlyMembers(monthNum, yearNum)
      .then((data) => setMensalistas(data.map((m) => m.name)))
      .catch(() => {});
  }, [form.month, form.year, isMensalista]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);
    if (!file) {
      setFeedback({ type: 'error', msg: 'Selecione um arquivo.' });
      return;
    }
    const data = new FormData();
    data.append('type', type);
    if (isMensalista) data.append('playerName', form.playerName);
    data.append('month', form.month);
    data.append('year', form.year);
    data.append('file', file);
    try {
      setLoading(true);
      await uploadReceipt(data);
      setFeedback({ type: 'success', msg: 'Comprovante enviado com sucesso!' });
      setForm(EMPTY_FORM);
      setFile(null);
      e.target.reset();
      onSuccess?.();
    } catch (err) {
      setFeedback({ type: 'error', msg: err.response?.data?.error || 'Erro ao enviar.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {feedback && (
        <Alert severity={feedback.type} sx={{ mb: 2 }}>
          {feedback.msg}
        </Alert>
      )}
      <Stack spacing={2}>
        {isMensalista && (
          <Autocomplete
            freeSolo
            options={mensalistas}
            inputValue={form.playerName}
            onInputChange={(_, val) => setForm((prev) => ({ ...prev, playerName: val }))}
            renderOption={(props, option) => (
              <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    bgcolor: getAvatarColor(option),
                  }}
                >
                  {getInitials(option)}
                </Avatar>
                <Typography variant="body2">{option}</Typography>
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Nome do Jogador"
                required
                size="small"
                helperText={mensalistas.length > 0 ? `${mensalistas.length} mensalista(s) neste mês` : ''}
              />
            )}
          />
        )}
        <Stack direction="row" spacing={2}>
          <TextField
            select
            label="Mês"
            name="month"
            value={form.month}
            onChange={handleChange}
            required
            fullWidth
            size="small"
          >
            {MONTH_NAMES.map((m) => (
              <MenuItem key={m} value={m}>{m}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Ano"
            name="year"
            value={form.year}
            onChange={handleChange}
            required
            sx={{ minWidth: 100 }}
            size="small"
          >
            {YEARS.map((y) => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </TextField>
        </Stack>
        <Button
          variant="outlined"
          component="label"
          startIcon={<UploadFileIcon />}
          fullWidth
        >
          {file ? file.name : 'Selecionar Arquivo'}
          <input
            type="file"
            hidden
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            onChange={(e) => setFile(e.target.files[0] || null)}
          />
        </Button>
        <Typography variant="caption" color="text.secondary">
          Formatos aceitos: JPG, PNG, WEBP ou PDF · Máx. 5 MB
        </Typography>
        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ReceiptIcon />}
        >
          {loading ? 'Anexando...' : 'Anexar Comprovante'}
        </Button>
      </Stack>
    </Box>
  );
}

function ReceiptList({ type }) {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getReceipts(type);
      setReceipts(data);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteReceipt(id);
      setReceipts((prev) => prev.filter((r) => r._id !== id));
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <Skeleton variant="rounded" height={80} />;
  if (!receipts.length) return (
    <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
      Nenhum comprovante enviado ainda.
    </Typography>
  );

  const uniqueYears = [...new Set(receipts.map(r => String(r.year)))].sort((a, b) => b - a);
  const visible = receipts.filter(r =>
    (!filterMonth || r.month === filterMonth) &&
    (!filterYear || String(r.year) === filterYear)
  );

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" fontWeight={700} display="block" mb={1}>
        FILTRAR POR PERÍODO
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }} useFlexGap>
        <TextField select size="small" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} sx={{ minWidth: 140 }} label="Mês">
          <MenuItem value="">Todos os meses</MenuItem>
          {MONTH_NAMES.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
        </TextField>
        <TextField select size="small" value={filterYear} onChange={(e) => setFilterYear(e.target.value)} sx={{ minWidth: 110 }} label="Ano">
          <MenuItem value="">Todos os anos</MenuItem>
          {uniqueYears.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
        </TextField>
        {(filterMonth || filterYear) && (
          <Button size="small" onClick={() => { setFilterMonth(''); setFilterYear(''); }}>Limpar</Button>
        )}
      </Stack>
      {visible.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
          Nenhum comprovante para o período selecionado.
        </Typography>
      ) : (
        <List dense disablePadding>
          {visible.map((r, i) => {
        const status = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pendente;
        return (
          <Box key={r._id}>
            {i > 0 && <Divider />}
            <ListItem disableGutters sx={{ py: 1 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <InsertDriveFileIcon color="action" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography variant="body2" fontWeight={600}>
                      {r.type === 'mensalista' ? r.playerName : 'Quadra'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {r.month}/{r.year}
                    </Typography>
                    <Chip
                      icon={status.icon}
                      label={status.label}
                      size="small"
                      color={status.color}
                      sx={{ height: 20, fontSize: '0.65rem', display: r.status === 'pendente' ? 'none' : undefined }}
                    />
                  </Stack>
                }
                secondary={r.fileName}
              />
              <Stack direction="row" spacing={0.5} sx={{ ml: 1 }}>
                <Tooltip title="Abrir arquivo">
                  <IconButton
                    size="small"
                    component="a"
                    href={r.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <LaunchIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Excluir">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(r._id)}
                    disabled={deleting === r._id}
                  >
                    {deleting === r._id
                      ? <CircularProgress size={14} color="inherit" />
                      : <DeleteIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Stack>
            </ListItem>
          </Box>
        );
          })}
        </List>
      )}
    </Box>
  );
}

export default function Comprovantes() {
  const [tab, setTab] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const handleSuccess = () => setRefreshKey((k) => k + 1);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <ReceiptIcon color="primary" sx={{ fontSize: 36 }} />
        <Typography variant="h4" fontWeight={700}>
          Comprovantes
        </Typography>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 3 }}
        variant="fullWidth"
      >
        <Tab
          icon={<PersonIcon />}
          iconPosition="start"
          label="Mensalista"
          sx={{ fontWeight: 700 }}
        />
        <Tab
          icon={<SportsVolleyballIcon />}
          iconPosition="start"
          label="Quadra"
          sx={{ fontWeight: 700 }}
        />
      </Tabs>

      {/* ── Mensalista ─────────────────────────────────────────── */}
      {tab === 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={1}>
              Anexar Comprovante Individual
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Comprovante de pagamento da sua mensalidade (PIX enviado ao responsável).
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <UploadForm type="mensalista" onSuccess={handleSuccess} />
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={0.5}>
              Enviados
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Histórico de comprovantes de mensalistas.
            </Typography>
            <ReceiptList key={`mensalista-${refreshKey}`} type="mensalista" />
          </Paper>
        </Box>
      )}

      {/* ── Quadra ─────────────────────────────────────────────── */}
      {tab === 1 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={1}>
              Anexar Comprovante da Quadra
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Comprovante de pagamento do aluguel da quadra — garante que o espaço foi quitado.
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <UploadForm type="quadra" onSuccess={handleSuccess} />
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={0.5}>
              Enviados
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Histórico de comprovantes da quadra.
            </Typography>
            <ReceiptList key={`quadra-${refreshKey}`} type="quadra" />
          </Paper>
        </Box>
      )}
    </Box>
  );
}

