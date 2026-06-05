import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Stack,
  IconButton,
  Tooltip,
  Alert,
  Skeleton,
  Chip,
  CircularProgress,
  Collapse,
  LinearProgress,
  Tabs,
  Tab,
  ToggleButtonGroup,
  ToggleButton,
  Autocomplete,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import EditIcon from '@mui/icons-material/Edit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { getHighlights, addHighlight, editHighlight, deleteHighlight } from '../services/api.js';
import { formatDatePT, MONTH_NAMES } from '../utils/holidays.js';

function getAvatarColor(name) {
  const palette = ['#1a237e', '#4a148c', '#006064', '#1b5e20', '#bf360c', '#e65100'];
  return palette[(name.charCodeAt(0) || 0) % palette.length];
}

function getInitials(name) {
  return name.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase() || '').join('');
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const EMPTY_FORM = { title: '', date: '', description: '', category: 'jogada', playerName: '' };


function StepBadge({ num }) {
  return (
    <Box sx={{
      width: 24, height: 24, borderRadius: '50%',
      bgcolor: 'primary.main', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: '0.75rem', flexShrink: 0,
    }}>{num}</Box>
  );
}

function FilmaEuModal({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        Como pegar seus Highlights?
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>

          {/* Passo 1 */}
          <Box sx={{ p: 2.5, display: 'flex', gap: 1.5 }}>
            <StepBadge num={1} />
            <Box>
              <Typography variant="subtitle2" fontWeight={700} mb={0.5}>
                Acesse o FilmaEu
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Entre no site com seu login e senha:
              </Typography>
              <Button
                component="a"
                href="https://filmaeu.com.br/"
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
                size="small"
                endIcon={<OpenInNewIcon fontSize="small" />}
                sx={{ fontWeight: 700, textTransform: 'none' }}
              >
                filmaeu.com.br
              </Button>
            </Box>
          </Box>

          {/* Passo 2 */}
          <Box sx={{ p: 2.5, display: 'flex', gap: 1.5 }}>
            <StepBadge num={2} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" fontWeight={700} mb={1}>
                Aplique os filtros
              </Typography>
              <Stack spacing={0.75}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ minWidth: 60 }}>CAMPO</Typography>
                  <Chip label="Quadra de Areia" size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ minWidth: 60 }}>DATA</Typography>
                  <Typography variant="body2">Data do jogo (sexta-feira)</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ minWidth: 60 }}>HORÁRIO</Typography>
                  <Chip label="22h" size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                  <Typography variant="caption" color="text.secondary">ou</Typography>
                  <Chip label="23h" size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                </Box>
              </Stack>
            </Box>
          </Box>

          {/* Passo 3 */}
          <Box sx={{ p: 2.5, display: 'flex', gap: 1.5 }}>
            <StepBadge num={3} />
            <Box>
              <Typography variant="subtitle2" fontWeight={700} mb={0.5}>
                Baixe o vídeo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Encontrou a jogada? Clique em <strong>baixar</strong> para salvar o vídeo no seu dispositivo.
              </Typography>
            </Box>
          </Box>

          {/* Passo 4 */}
          <Box sx={{ p: 2.5, display: 'flex', gap: 1.5, bgcolor: 'primary.main', borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }}>
            <StepBadge num={4} />
            <Box>
              <Typography variant="subtitle2" fontWeight={700} mb={0.5} sx={{ color: '#fff' }}>
                Faça o upload
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                Volte aqui e use <strong style={{ color: '#fdd835' }}>"Adicionar Highlight"</strong> para enviar o vídeo.
              </Typography>
            </Box>
          </Box>

        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, py: 1.5 }}>
        <Button onClick={onClose} variant="outlined" size="small">Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}

function HighlightCard({ highlight, onDelete, onEdit, mensalistas }) {
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    title: highlight.title,
    date: highlight.date,
    description: highlight.description || '',
    category: highlight.category || 'jogada',
    playerName: highlight.playerName || '',
  });
  const videoSrc = highlight.filePath;

  const handleDelete = async () => {
    setDeleting(true);
    try { await onDelete(highlight._id); } finally { setDeleting(false); }
  };

  const handleStartEdit = () => {
    setEditForm({
      title: highlight.title,
      date: highlight.date,
      description: highlight.description || '',
      category: highlight.category || 'jogada',
      playerName: highlight.playerName || '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!editForm.title.trim() || !editForm.date) return;
    setSaving(true);
    try {
      await onEdit(highlight._id, editForm);
      setEditing(false);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 0 }}>
        <video
          controls
          style={{ width: '100%', display: 'block', maxHeight: 280, background: '#000' }}
          src={videoSrc}
          preload="metadata"
        />
        <Box sx={{ p: 2 }}>
          {editing ? (
            <Stack spacing={1.5}>
              <ToggleButtonGroup
                value={editForm.category}
                exclusive
                onChange={(_, v) => v && setEditForm((p) => ({ ...p, category: v }))}
                size="small"
                fullWidth
              >
                <ToggleButton value="jogada" sx={{ flex: 1, gap: 0.5 }}>
                  <AutoAwesomeIcon fontSize="small" /> Jogada Bonita
                </ToggleButton>
                <ToggleButton value="comedia" sx={{ flex: 1, gap: 0.5 }}>
                  <EmojiEmotionsIcon fontSize="small" /> Momento Comedia
                </ToggleButton>
              </ToggleButtonGroup>
              <TextField
                label="Titulo"
                value={editForm.title}
                onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                size="small"
                fullWidth
                required
              />
              <TextField
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm((p) => ({ ...p, date: e.target.value }))}
                size="small"
                fullWidth
              />
              <Autocomplete
                freeSolo
                options={mensalistas}
                value={editForm.playerName}
                inputValue={editForm.playerName}
                onChange={(_, val) => val !== null && setEditForm((p) => ({ ...p, playerName: typeof val === 'string' ? val : '' }))}
                onInputChange={(_, val) => setEditForm((p) => ({ ...p, playerName: val }))}
                renderOption={(props, option) => (
                  <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', fontWeight: 700, bgcolor: getAvatarColor(option) }}>
                      {getInitials(option)}
                    </Avatar>
                    <Typography variant="body2">{option}</Typography>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField {...params} label="Jogador em destaque (opcional)" size="small" />
                )}
              />
              <TextField
                label="Descricao (opcional)"
                value={editForm.description}
                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                size="small"
                fullWidth
                multiline
                rows={2}
              />
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button size="small" onClick={() => setEditing(false)} disabled={saving}>
                  Cancelar
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleSave}
                  disabled={saving || !editForm.title.trim() || !editForm.date}
                  startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <EditIcon fontSize="small" />}
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </Stack>
            </Stack>
          ) : (
            <>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" fontWeight={700} lineHeight={1.3}>
                    {highlight.title}
                  </Typography>
                  {highlight.description && (
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                      {highlight.description}
                    </Typography>
                  )}
                </Box>
                {highlight.playerName && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25, mr: 0.5 }}>
                    <Avatar sx={{ width: 20, height: 20, fontSize: '0.6rem', fontWeight: 700, bgcolor: getAvatarColor(highlight.playerName) }}>
                      {getInitials(highlight.playerName)}
                    </Avatar>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {highlight.playerName}
                    </Typography>
                  </Box>
                )}
                <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }}>
                  <Tooltip title="Editar">
                    <IconButton size="small" color="primary" onClick={handleStartEdit}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Excluir">
                    <IconButton size="small" color="error" onClick={handleDelete} disabled={deleting}>
                      {deleting ? <CircularProgress size={14} color="inherit" /> : <DeleteIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
              <Box sx={{ mt: 1, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                <Chip
                  icon={highlight.category === 'comedia'
                    ? <EmojiEmotionsIcon sx={{ fontSize: '0.85rem !important' }} />
                    : <AutoAwesomeIcon sx={{ fontSize: '0.85rem !important' }} />}
                  label={highlight.category === 'comedia' ? 'Comedia' : 'Jogada Bonita'}
                  size="small"
                  color={highlight.category === 'comedia' ? 'warning' : 'primary'}
                  sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                />
                <Chip
                  label={formatDatePT(highlight.date)}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                />
              </Box>
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function Highlights() {
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showFilmaEu, setShowFilmaEu] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formError, setFormError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [activePlayer, setActivePlayer] = useState('all');
  const [activeMonth, setActiveMonth] = useState('all');
  const [mensalistas, setMensalistas] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHighlights();
      setHighlights(data);
    } catch {
      // silent: show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const now = new Date();
    import('../services/api.js').then(({ getMonthlyMembers }) =>
      getMonthlyMembers(now.getMonth() + 1, now.getFullYear())
        .then((members) => setMensalistas(members.map((m) => m.name)))
        .catch(() => {})
    );
  }, []);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!form.title.trim() || !form.date || !file) {
      setFormError('Preencha titulo, data e selecione o arquivo de video.');
      return;
    }
    const data = new FormData();
    data.append('title', form.title.trim());
    data.append('date', form.date);
    data.append('description', form.description.trim());
    data.append('category', form.category);
    data.append('playerName', form.playerName);
    data.append('file', file);
    try {
      setSubmitting(true);
      setUploadProgress(0);
      const created = await addHighlight(data, {
        onUploadProgress: (e) => setUploadProgress(Math.round((e.loaded / e.total) * 100)),
      });
      setHighlights((prev) => [created, ...prev]);
      setForm(EMPTY_FORM);
      setFile(null);
      setShowForm(false);
      setUploadProgress(0);
    } catch (err) {
      setFormError(err?.response?.data?.error || 'Erro ao enviar video.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    await deleteHighlight(id);
    setHighlights((prev) => prev.filter((h) => h._id !== id));
  };

  const handleEdit = async (id, data) => {
    const updated = await editHighlight(id, data);
    setHighlights((prev) => prev.map((h) => (h._id === id ? updated : h)));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VideoLibraryIcon color="primary" sx={{ fontSize: 36 }} />
          <Typography variant="h4" fontWeight={700}>Highlights</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<OpenInNewIcon />}
            onClick={() => setShowFilmaEu(true)}
            sx={{ fontWeight: 700 }}
          >
            FilmaEu
          </Button>
          <Button
            variant="contained"
            startIcon={showForm ? <ExpandLessIcon /> : <AddIcon />}
            onClick={() => setShowForm((v) => !v)}
            sx={{ fontWeight: 700 }}
          >
            {showForm ? 'Cancelar' : 'Adicionar Highlight'}
          </Button>
        </Stack>
      </Box>

      <Collapse in={showForm}>
        <Card sx={{ mb: 3, borderLeft: '5px solid', borderColor: 'primary.main' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Novo Highlight</Typography>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                    CATEGORIA *
                  </Typography>
                  <ToggleButtonGroup
                    value={form.category}
                    exclusive
                    onChange={(_, v) => v && setForm((p) => ({ ...p, category: v }))}
                    size="small"
                    fullWidth
                  >
                    <ToggleButton value="jogada" sx={{ flex: 1, gap: 0.5 }}>
                      <AutoAwesomeIcon fontSize="small" /> Jogada Bonita
                    </ToggleButton>
                    <ToggleButton value="comedia" sx={{ flex: 1, gap: 0.5 }}>
                      <EmojiEmotionsIcon fontSize="small" /> Momento Comedia
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                <Autocomplete
                  freeSolo
                  options={mensalistas}
                  inputValue={form.playerName}
                  onInputChange={(_, val) => setForm((p) => ({ ...p, playerName: val }))}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', fontWeight: 700, bgcolor: getAvatarColor(option) }}>
                        {getInitials(option)}
                      </Avatar>
                      <Typography variant="body2">{option}</Typography>
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Jogador em destaque (opcional)"
                      size="small"
                      placeholder="Buscar mensalista ou digitar nome"
                    />
                  )}
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Titulo"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                    fullWidth
                    size="small"
                    placeholder="Ex: rally, momento engraçado, lance bonito"
                  />
                  <TextField
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={handleChange}
                    required
                    size="small"
                    sx={{ minWidth: 160 }}
                  />
                </Stack>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadFileIcon />}
                  fullWidth
                  color={file ? 'success' : 'primary'}
                >
                  {file ? file.name : 'Selecionar Video (MP4, MOV, etc.)'}
                  <input
                    type="file"
                    hidden
                    accept="video/*"
                    onChange={(e) => setFile(e.target.files[0] || null)}
                  />
                </Button>
                {file && (
                  <Typography variant="caption" color="text.secondary">
                    {(file.size / (1024 * 1024)).toFixed(1)} MB
                  </Typography>
                )}
                <TextField
                  label="Descricao (opcional)"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  placeholder="Detalhes sobre o jogo, resultado, etc."
                />
                {submitting && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" mb={0.5} display="block">
                      Enviando... {uploadProgress}%
                    </Typography>
                    <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: 2 }} />
                  </Box>
                )}
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
                  sx={{ alignSelf: 'flex-start', fontWeight: 700 }}
                >
                  {submitting ? 'Enviando...' : 'Salvar Highlight'}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Collapse>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && highlights.length > 0 && (
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`Todos (${highlights.length})`} value="all" />
          <Tab
            icon={<AutoAwesomeIcon fontSize="small" />}
            iconPosition="start"
            label={`Jogadas Bonitas (${highlights.filter(h => (h.category ?? 'jogada') !== 'comedia').length})`}
            value="jogada"
          />
          <Tab
            icon={<EmojiEmotionsIcon fontSize="small" />}
            iconPosition="start"
            label={`Momentos Comedia (${highlights.filter(h => h.category === 'comedia').length})`}
            value="comedia"
          />
        </Tabs>
      )}

      {!loading && highlights.some(h => h.playerName?.trim()) && (
        <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mr: 0.5 }}>
            Jogador:
          </Typography>
          <Chip
            label="Todos"
            size="small"
            onClick={() => setActivePlayer('all')}
            color={activePlayer === 'all' ? 'primary' : 'default'}
            variant={activePlayer === 'all' ? 'filled' : 'outlined'}
            sx={{ fontWeight: 600 }}
          />
          {[...new Set(highlights.filter(h => h.playerName?.trim()).map(h => h.playerName))].map((name) => (
            <Chip
              key={name}
              avatar={
                <Avatar sx={{ bgcolor: getAvatarColor(name) + ' !important', color: '#fff !important' }}>
                  {getInitials(name)}
                </Avatar>
              }
              label={name}
              size="small"
              onClick={() => setActivePlayer(activePlayer === name ? 'all' : name)}
              color={activePlayer === name ? 'primary' : 'default'}
              variant={activePlayer === name ? 'filled' : 'outlined'}
              sx={{ fontWeight: 600 }}
            />
          ))}
        </Box>
      )}

      {!loading && highlights.length > 0 && (() => {
        const months = [...new Set(highlights.map(h => h.date?.substring(0, 7)).filter(Boolean))].sort().reverse();
        if (months.length <= 1) return null;
        return (
          <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mr: 0.5 }}>
              Período:
            </Typography>
            <Chip
              label="Todos"
              size="small"
              onClick={() => setActiveMonth('all')}
              color={activeMonth === 'all' ? 'secondary' : 'default'}
              variant={activeMonth === 'all' ? 'filled' : 'outlined'}
              sx={{ fontWeight: 600 }}
            />
            {months.map((ym) => {
              const [y, m] = ym.split('-').map(Number);
              const label = MONTH_NAMES[m - 1].substring(0, 3) + '/' + y;
              return (
                <Chip
                  key={ym}
                  label={label}
                  size="small"
                  onClick={() => setActiveMonth(activeMonth === ym ? 'all' : ym)}
                  color={activeMonth === ym ? 'secondary' : 'default'}
                  variant={activeMonth === ym ? 'filled' : 'outlined'}
                  sx={{ fontWeight: 600 }}
                />
              );
            })}
          </Box>
        );
      })()}

      {loading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
          {[1, 2, 3, 4].map((k) => <Skeleton key={k} variant="rounded" height={320} />)}
        </Box>
      ) : highlights.length === 0 ? (
        <Card variant="outlined">
          <CardContent sx={{ py: 6, textAlign: 'center' }}>
            <VideoLibraryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">Nenhum highlight cadastrado ainda.</Typography>
            <Typography variant="body2" color="text.disabled" mt={0.5}>
              Adicione um clipe de video para comecar.
            </Typography>
          </CardContent>
        </Card>
      ) : (() => {
        const filtered = highlights
          .filter(h => activeTab === 'all' || (h.category ?? 'jogada') === activeTab)
          .filter(h => activePlayer === 'all' || h.playerName === activePlayer)
          .filter(h => activeMonth === 'all' || h.date?.startsWith(activeMonth));
        return filtered.length === 0 ? (
          <Card variant="outlined">
            <CardContent sx={{ py: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">Nenhum highlight encontrado com esses filtros.</Typography>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
            {filtered.map((h) => (
              <HighlightCard key={h._id} highlight={h} onDelete={handleDelete} onEdit={handleEdit} mensalistas={mensalistas} />
            ))}
          </Box>
        );
      })()}
      <FilmaEuModal open={showFilmaEu} onClose={() => setShowFilmaEu(false)} />
    </Box>
  );
}
