import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Avatar,
  Stack,
  Button,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  LinearProgress,
  Divider,
  IconButton,
  Skeleton,
  Tooltip,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import GroupIcon from '@mui/icons-material/Group';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import {
  ensureSession,
  getAttendance,
  addAttendance,
  removeAttendance,
  updateAttendance,
  getMonthlyMembers,
  uploadAttendanceComprovante,
  deleteAttendanceComprovante,
} from '../services/api.js';
import { formatDatePT, isHoliday, calcMonthlyValues, MONTH_NAMES } from '../utils/holidays.js';

function getAvatarColor(name) {
  const palette = ['#1a237e', '#4a148c', '#006064', '#1b5e20', '#bf360c', '#e65100'];
  return palette[name.charCodeAt(0) % palette.length];
}

function getInitials(name) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
}

const EMPTY_FORM = {
  playerName: '',
  paymentType: 'mensal',
  isSubstitute: false,
  substituteFor: '',
};

export default function Presenca() {
  const { date } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [mensalistas, setMensalistas] = useState([]);

  const holidayInfo = date ? isHoliday(date) : null;

  // Derive month/year from session date for dynamic pricing
  const [sessionYear, sessionMonth] = date
    ? date.split('-').map(Number)
    : [new Date().getFullYear(), new Date().getMonth() + 1];
  const { pricePerPerson: PRICE_MENSAL, avulsoPrice: PRICE_AVULSO } = calcMonthlyValues(sessionYear, sessionMonth);

  useEffect(() => {
    getMonthlyMembers(sessionMonth, sessionYear)
      .then((data) => setMensalistas(data.map((m) => m.name)))
      .catch(() => {});
  }, [sessionMonth, sessionYear]);

  const loadData = useCallback(async () => {
    if (!date) return;
    setLoading(true);
    setError(null);
    try {
      const [sess, list] = await Promise.all([
        ensureSession(date),
        // We'll fetch attendance after we have the session id
      ]);
      setSession(sess);
      const list2 = await getAttendance(sess._id);
      setAttendance(list2);
    } catch (err) {
      setError(err?.response?.data?.error || 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!form.playerName.trim()) {
      setFormError('Informe o nome do jogador.');
      return;
    }
    if (form.isSubstitute && !form.substituteFor.trim()) {
      setFormError('Informe quem está sendo substituído.');
      return;
    }
    if (attendance.length >= (session?.maxPlayers ?? 18)) {
      setFormError('Lista já está completa (18 jogadores).');
      return;
    }
    try {
      setSubmitting(true);
      const entry = await addAttendance({
        sessionId: session._id,
        playerName: form.playerName.trim(),
        paymentType: form.paymentType,
        isSubstitute: form.isSubstitute,
        substituteFor: form.substituteFor.trim(),
      });
      setAttendance((prev) => [...prev, entry]);
      setForm(EMPTY_FORM);
    } catch (err) {
      setFormError(err?.response?.data?.error || 'Erro ao adicionar jogador.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      await removeAttendance(id);
      setAttendance((prev) => prev.filter((a) => a._id !== id));
    } catch {
      setError('Erro ao remover jogador.');
    }
  };

  const max = session?.maxPlayers ?? 18;
  const count = attendance.length;
  const [uploadingAttId, setUploadingAttId] = useState(null);
  const [attDialog, setAttDialog] = useState({ open: false, record: null });
  const [attUploadError, setAttUploadError] = useState(null);
  const [attUploading, setAttUploading] = useState(false);
  const [attFile, setAttFile] = useState(null);

  const handleOpenAttDialog = (record) => {
    setAttFile(null);
    setAttDialog({ open: true, record });
  };

  const handleCloseAttDialog = () => {
    setAttDialog({ open: false, record: null });
    setAttFile(null);
    setAttUploadError(null);
    setAttUploading(false);
  };

  const handleSubmitAttComprovante = async () => {
    if (!attFile || !attDialog.record) return;
    const id = attDialog.record._id;
    setAttUploading(true);
    setAttUploadError(null);
    try {
      const updated = await uploadAttendanceComprovante(id, attFile);
      setAttendance((prev) => prev.map((a) => (a._id === id ? { ...a, ...updated } : a)));
      handleCloseAttDialog();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || String(err);
      setAttUploadError(msg);
    } finally {
      setAttUploading(false);
    }
  };

  const handleRemoveAttComprovante = async (id) => {
    setUploadingAttId(id);
    try {
      const updated = await deleteAttendanceComprovante(id);
      setAttendance((prev) => prev.map((a) => (a._id === id ? { ...a, ...updated } : a)));
    } catch { /* silent */ } finally { setUploadingAttId(null); }
  };

  const handleTogglePaid = async (id, current) => {
    try {
      const updated = await updateAttendance(id, { hasPaid: !current });
      setAttendance((prev) => prev.map((a) => (a._id === id ? { ...a, hasPaid: updated.hasPaid } : a)));
    } catch { /* silent */ }
  };

  const mensalCount      = attendance.filter((a) => a.paymentType === 'mensal').length;
  const avulsoCount      = attendance.filter((a) => a.paymentType === 'avulso' && !a.isSubstitute).length;
  const avulsoPaid       = attendance.filter((a) => a.paymentType === 'avulso' && !a.isSubstitute && a.hasPaid).length;
  const avulsoPending    = avulsoCount - avulsoPaid;
  const totalFinanceiro  = (mensalCount + avulsoPaid) * PRICE_AVULSO;

  function capacityColor() {
    const pct = count / max;
    if (pct >= 1) return 'error';
    if (pct >= 0.7) return 'warning';
    return 'success';
  }

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 1 }} />
        <Skeleton variant="rounded" height={100} sx={{ mb: 2 }} />
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} variant="rounded" height={64} sx={{ mb: 1 }} />
        ))}
      </Box>
    );
  }

  if (error && !session) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/calendario')} sx={{ mb: 2 }}>
          Voltar ao Calendário
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* ── Back + Header ───────────────────────────────────────── */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/calendario')}
        sx={{ mb: 2, fontWeight: 600 }}
      >
        Calendário
      </Button>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800} textTransform="capitalize">
          {date ? formatDatePT(date) : ''}
        </Typography>
        <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" useFlexGap>
          <Chip label="22h – 00h" color="primary" size="small" />
          {holidayInfo && (
            <Chip
              icon={<WarningAmberIcon />}
              label={`Feriado: ${holidayInfo.name}`}
              color="warning"
              size="small"
            />
          )}
          {session?.isCancelled && (
            <Chip label="Cancelado" color="error" size="small" />
          )}
        </Stack>
        {holidayInfo && !session?.isCancelled && (
          <Alert severity="warning" sx={{ mt: 1.5 }}>
            Este dia é feriado ({holidayInfo.name}). Confirme com o grupo se haverá jogo.
          </Alert>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── Capacity bar ────────────────────────────────────────── */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: '20px !important' }}>
          <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <GroupIcon color="primary" />
              <Typography fontWeight={700}>Lista de Presença</Typography>
            </Box>
            <Typography variant="h6" fontWeight={800} color={`${capacityColor()}.main`} sx={{ ml: 'auto' }}>
              {count}/{max}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={(count / max) * 100}
            color={capacityColor()}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
            {max - count > 0 ? `${max - count} vaga${max - count > 1 ? 's' : ''} disponível` : 'Lista completa!'}
          </Typography>
        </CardContent>
      </Card>

      {/* ── Attendance list ─────────────────────────────────────── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1, mb: 3 }}>
        {[...Array(max)].map((_, idx) => {
          const player = attendance[idx];
          const isLeft = idx % 2 === 0;
          return (
            <Card
              key={idx}
              variant="outlined"
              sx={{
                bgcolor: player ? 'background.paper' : 'background.default',
                borderStyle: player ? 'solid' : 'dashed',
                borderColor: player ? 'divider' : 'grey.300',
                borderRight: { xs: undefined, md: isLeft ? '2px solid' : undefined },
                borderRightColor: { md: isLeft ? 'primary.main' : undefined },
              }}
            >
              <CardContent
                sx={{
                  py: '10px !important',
                  px: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                {/* Number */}
                <Typography
                  variant="body2"
                  fontWeight={700}
                  color="text.secondary"
                  sx={{ minWidth: 24, textAlign: 'right' }}
                >
                  {idx + 1}
                </Typography>

                {player ? (
                  <>
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        bgcolor: getAvatarColor(player.playerName),
                      }}
                    >
                      {getInitials(player.playerName)}
                    </Avatar>

                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" fontWeight={700} lineHeight={1.2}>
                        {player.playerName}
                      </Typography>
                      {player.isSubstitute && player.substituteFor && (
                        <Typography variant="caption" color="text.secondary">
                          sub por {player.substituteFor}
                        </Typography>
                      )}
                    </Box>

                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Chip
                        label={player.paymentType === 'mensal' ? 'Mensalista' : 'Avulso'}
                        size="small"
                        color={player.paymentType === 'mensal' ? 'primary' : 'warning'}
                        sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                      />
                      {player.paymentType === 'avulso' && !player.isSubstitute && (
                        <Tooltip title={player.hasPaid ? 'Pago — clique para desmarcar' : 'Marcar como pago'}>
                          <IconButton
                            size="small"
                            onClick={() => handleTogglePaid(player._id, player.hasPaid)}
                            sx={{ color: player.hasPaid ? 'success.main' : 'text.disabled', p: 0.25 }}
                          >
                            {player.hasPaid
                              ? <CheckCircleIcon fontSize="small" />
                              : <RadioButtonUncheckedIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      )}
                      {player.paymentType === 'avulso' && !player.isSubstitute && (
                        uploadingAttId === player._id ? (
                          <CircularProgress size={16} sx={{ mx: 0.25 }} />
                        ) : player.comprovantePath ? (
                          <>
                            <Tooltip title="Ver comprovante">
                              <IconButton size="small" sx={{ color: 'success.main', p: 0.25 }} component="a" href={player.comprovantePath} target="_blank" rel="noreferrer">
                                <ReceiptLongIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Remover comprovante">
                              <IconButton size="small" sx={{ color: 'text.disabled', p: 0.25 }} onClick={() => handleRemoveAttComprovante(player._id)}>
                                <AttachFileIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        ) : (
                          <Tooltip title="Anexar comprovante">
                            <IconButton size="small" sx={{ color: 'text.disabled', p: 0.25 }} onClick={() => handleOpenAttDialog(player)}>
                              <AttachFileIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )
                      )}
                      {player.isSubstitute && (
                        <Chip
                          label="SUB"
                          size="small"
                          color="secondary"
                          sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                        />
                      )}
                      <Tooltip title="Remover da lista">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemove(player._id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </>
                ) : (
                  <Typography variant="body2" color="text.disabled" sx={{ flex: 1 }}>
                    — disponível
                  </Typography>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* ── Add player form ─────────────────────────────────────── */}
      {!session?.isCancelled && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PersonAddIcon color="primary" />
              <Typography variant="h6" fontWeight={700}>
                Adicionar Jogador
              </Typography>
            </Box>

            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}

            <Box component="form" onSubmit={handleAdd}>
              <Stack spacing={2}>
                <Autocomplete
                  freeSolo
                  options={mensalistas}
                  inputValue={form.playerName}
                  onInputChange={(_, val) => setForm((f) => ({ ...f, playerName: val }))}
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
                      label="Nome do jogador"
                      required
                      size="small"
                      helperText={mensalistas.length > 0 ? `${mensalistas.length} mensalista(s) cadastrado(s) este mês` : ''}
                    />
                  )}
                />

                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} mb={0.5} display="block">
                    TIPO DE PAGAMENTO
                  </Typography>
                  <ToggleButtonGroup
                    value={form.paymentType}
                    exclusive
                    onChange={(_, v) => v && setForm((f) => ({ ...f, paymentType: v }))}
                    size="small"
                    fullWidth
                  >
                    <ToggleButton value="mensal" sx={{ fontWeight: 700 }}>
                      Mensalista · R$40
                    </ToggleButton>
                    <ToggleButton value="avulso" sx={{ fontWeight: 700 }}>
                      Avulso · R$10
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.isSubstitute}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          isSubstitute: e.target.checked,
                          paymentType: e.target.checked ? 'avulso' : f.paymentType,
                        }))
                      }
                    />
                  }
                  label="É substituto de um mensalista"
                />

                {form.isSubstitute && (
                  <Autocomplete
                    freeSolo
                    options={mensalistas}
                    inputValue={form.substituteFor}
                    onInputChange={(_, val) => setForm((f) => ({ ...f, substituteFor: val }))}
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
                        label="Em lugar de (nome do mensalista)"
                        required
                        size="small"
                      />
                    )}
                  />
                )}

                <Button
                  type="submit"
                  variant="contained"
                  startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <PersonAddIcon />}
                  disabled={submitting || count >= max}
                  fullWidth
                >
                  {submitting ? 'Adicionando...' : 'Adicionar à Lista'}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ── Financial summary ───────────────────────────────────── */}
      <Card sx={{ borderLeft: '5px solid', borderColor: 'secondary.main' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={2}>
            Resumo Financeiro
          </Typography>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary" sx={{ flex: 1, minWidth: 0 }}>
                Mensalistas ({mensalCount} × R${PRICE_AVULSO}/jogo)
              </Typography>
              <Typography variant="body2" fontWeight={700} sx={{ flexShrink: 0, ml: 2 }}>
                R${mensalCount * PRICE_AVULSO},00
              </Typography>
            </Stack>
            {avulsoCount > 0 && (
              <>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1, minWidth: 0 }}>
                    Avulsos pagos ({avulsoPaid} × R${PRICE_AVULSO}) — caixa do vôlei
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="success.main" sx={{ flexShrink: 0, ml: 2 }}>
                    R${avulsoPaid * PRICE_AVULSO},00
                  </Typography>
                </Stack>
                {avulsoPending > 0 && (
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary" sx={{ flex: 1, minWidth: 0 }}>
                      Avulsos pendentes ({avulsoPending})
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color="warning.main" sx={{ flexShrink: 0, ml: 2 }}>
                      R${avulsoPending * PRICE_AVULSO},00
                    </Typography>
                  </Stack>
                )}
              </>
            )}
            <Divider />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography fontWeight={700}>Total pago deste jogo</Typography>
              <Typography variant="h6" fontWeight={800} color="primary.main" sx={{ flexShrink: 0, ml: 2 }}>
                R${totalFinanceiro},00
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
      {/* ── Comprovante Avulso Dialog ─────────────────────────── */}
      <Dialog open={attDialog.open} onClose={handleCloseAttDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Anexar Comprovante</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Jogador"
              value={attDialog.record?.playerName ?? ''}
              size="small"
              fullWidth
              disabled
            />
            <TextField
              label="Mês / Ano"
              value={`${MONTH_NAMES[sessionMonth - 1]} ${sessionYear}`}
              size="small"
              fullWidth
              disabled
            />
            <Button
              variant="outlined"
              component="label"
              startIcon={<AttachFileIcon />}
              fullWidth
              color={attFile ? 'success' : 'primary'}
            >
              {attFile ? attFile.name : 'Selecionar arquivo (imagem ou PDF)'}
              <input
                type="file"
                hidden
                accept="image/*,application/pdf"
                onChange={(e) => setAttFile(e.target.files?.[0] ?? null)}
              />
            </Button>
            {attFile && (
              <Typography variant="caption" color="text.secondary">
                {(attFile.size / 1024).toFixed(0)} KB
              </Typography>
            )}
          </Stack>
        </DialogContent>
        {attUploadError && (
          <Box sx={{ px: 3, pb: 1 }}>
            <Alert severity="error" onClose={() => setAttUploadError(null)}>{attUploadError}</Alert>
          </Box>
        )}
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button onClick={handleCloseAttDialog} disabled={attUploading}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSubmitAttComprovante}
            disabled={!attFile || attUploading}
            startIcon={attUploading ? <CircularProgress size={14} color="inherit" /> : null}
          >
            {attUploading ? 'Enviando...' : 'Enviar'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
