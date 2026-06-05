import { useEffect, useState, useCallback } from 'react';
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
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Skeleton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PixIcon from '@mui/icons-material/Pix';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import {
  getMonthlyMembers,
  addMonthlyMember,
  updateMonthlyMember,
  removeMonthlyMember,
  getAvulsoSummary,
  uploadMemberComprovante,
  deleteMemberComprovante,
} from '../services/api.js';
import { MONTH_NAMES, calcMonthlyValues } from '../utils/holidays.js';

const MAX_PLAYERS = 18;
const GAME_PRICE = 10;

function getAvatarColor(name) {
  const palette = ['#1a237e', '#4a148c', '#006064', '#1b5e20', '#bf360c', '#e65100'];
  return palette[name.charCodeAt(0) % palette.length];
}

function getInitials(name) {
  return name.split(' ').slice(0, 2).map((n) => n[0].toUpperCase()).join('');
}

export default function Mensalistas() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);
  const [avulsoData, setAvulsoData] = useState({ avulsoCount: 0, paidCount: 0, unpaidCount: 0, bySession: [], players: [] });
  const [comprovanteDialog, setComprovanteDialog] = useState({ open: false, member: null });
  const [comprovanteUploadError, setComprovanteUploadError] = useState(null);
  const [comprovanteUploading, setComprovanteUploading] = useState(false);
  const [comprovanteFile, setComprovanteFile] = useState(null);
  const [uploadingMemberId, setUploadingMemberId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, avulso] = await Promise.all([
        getMonthlyMembers(month, year),
        getAvulsoSummary(month, year),
      ]);
      setMembers(data);
      setAvulsoData(avulso);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setAddError(null);
    if (!newName.trim()) { setAddError('Informe o nome.'); return; }
    try {
      setAdding(true);
      const member = await addMonthlyMember({ name: newName.trim(), month, year });
      setMembers((prev) => [...prev, member]);
      setNewName('');
    } catch (err) {
      setAddError(err?.response?.data?.error || 'Erro ao adicionar.');
    } finally {
      setAdding(false);
    }
  };

  const handleTogglePaid = async (id, current) => {
    try {
      const updated = await updateMonthlyMember(id, { hasPaid: !current });
      setMembers((prev) => prev.map((m) => (m._id === id ? updated : m)));
    } catch {
      setError('Erro ao atualizar status.');
    }
  };

  const handleRemove = async (id) => {
    try {
      await removeMonthlyMember(id);
      setMembers((prev) => prev.filter((m) => m._id !== id));
    } catch {
      setError('Erro ao remover membro.');
    }
  };

  const paidCount = members.filter((m) => m.hasPaid).length;
  const pendingCount = members.length - paidCount;
  const { numFridays, totalCost, pricePerPerson } = calcMonthlyValues(year, month);
  const totalReceived = paidCount * pricePerPerson;
  const avulsoTotal   = avulsoData.paidCount * GAME_PRICE;
  const totalArrecadado = totalReceived + avulsoTotal;


  const handleOpenComprovanteDialog = (member) => {
    setComprovanteFile(null);
    setComprovanteDialog({ open: true, member });
  };

  const handleCloseComprovanteDialog = () => {
    setComprovanteDialog({ open: false, member: null });
    setComprovanteFile(null);
    setComprovanteUploadError(null);
    setComprovanteUploading(false);
  };

  const handleSubmitComprovante = async () => {
    if (!comprovanteFile || !comprovanteDialog.member) return;
    const id = comprovanteDialog.member._id;
    setComprovanteUploading(true);
    setComprovanteUploadError(null);
    try {
      const updated = await uploadMemberComprovante(id, comprovanteFile);
      setMembers((prev) => prev.map((m) => (m._id === id ? updated : m)));
      handleCloseComprovanteDialog();
    } catch (err) {
      setComprovanteUploadError(err?.response?.data?.error || 'Erro ao enviar. Tente novamente.');
    } finally {
      setComprovanteUploading(false);
    }
  };

  const handleRemoveMemberComprovante = async (id) => {
    setUploadingMemberId(id);
    try {
      const updated = await deleteMemberComprovante(id);
      setMembers((prev) => prev.map((m) => (m._id === id ? updated : m)));
    } catch {
      // silently ignore
    } finally {
      setUploadingMemberId(null);
    }
  };

  return (
    <Box>
      {/* ── Header ────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <GroupIcon color="primary" sx={{ fontSize: 36 }} />
        <Typography variant="h4" fontWeight={700}>
          Mensalistas
        </Typography>
      </Box>

      {/* ── Month navigation ──────────────────────────────────── */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <IconButton onClick={prevMonth} color="primary"><ChevronLeftIcon /></IconButton>
            <Box textAlign="center">
              <Typography variant="h5" fontWeight={800}>{MONTH_NAMES[month - 1]}</Typography>
              <Typography variant="body2" color="text.secondary">{year}</Typography>
            </Box>
            <IconButton onClick={nextMonth} color="primary"><ChevronRightIcon /></IconButton>
          </Stack>
        </CardContent>
      </Card>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        {[
          { label: 'Total', value: members.length, color: 'text.primary' },
          { label: 'Pagos', value: paidCount, color: 'success.main' },
          { label: 'Pendentes', value: pendingCount, color: 'warning.main' },
          { label: 'Arrecadado', value: `R$${totalArrecadado}`, color: 'primary.main' },
          { label: 'Avulsos', value: avulsoData.avulsoCount, color: 'secondary.main' },
          { label: 'Caixa Avulso', value: `R$${avulsoTotal}`, color: 'secondary.main' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent sx={{ textAlign: 'center', py: '12px !important', px: 1 }}>
              <Typography variant="h5" fontWeight={800} color={s.color}>
                {s.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── Member list ───────────────────────────────────────── */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ px: 2, py: 1.5, bgcolor: 'primary.main', borderRadius: '12px 12px 0 0' }}>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{ letterSpacing: 2, textTransform: 'uppercase', fontSize: '0.75rem', color: '#fff' }}
            >
              Lista Mensal de {MONTH_NAMES[month - 1]} {year}
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ p: 2 }}>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} height={64} sx={{ mb: 0.5 }} />
              ))}
            </Box>
          ) : members.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Nenhum mensalista cadastrado para {MONTH_NAMES[month - 1]} {year}.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
              {members.map((member, idx) => (
                <Box
                  key={member._id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 2,
                    py: 1.5,
                    bgcolor: member.hasPaid ? 'rgba(46,125,50,0.04)' : 'background.paper',
                    borderBottom: '1px solid',
                    borderBottomColor: 'divider',
                    borderRight: { xs: 'none', md: idx % 2 === 0 ? '1px solid' : 'none' },
                    borderRightColor: { md: 'primary.main' },
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    color="text.secondary"
                    sx={{ minWidth: 24, textAlign: 'right' }}
                  >
                    {idx + 1}
                  </Typography>

                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      bgcolor: getAvatarColor(member.name),
                    }}
                  >
                    {getInitials(member.name)}
                  </Avatar>

                  <Typography variant="body1" fontWeight={600} sx={{ flex: 1 }}>
                    {member.name}
                  </Typography>

                  <Chip
                    icon={member.hasPaid ? <CheckCircleIcon /> : <HourglassEmptyIcon />}
                    label={member.hasPaid ? 'Pago' : 'Pendente'}
                    size="small"
                    color={member.hasPaid ? 'success' : 'default'}
                    sx={{ fontWeight: 700, minWidth: 90 }}
                    onClick={() => handleTogglePaid(member._id, member.hasPaid)}
                    clickable
                  />

                  {member.hasPaid && (
                    uploadingMemberId === member._id ? (
                      <CircularProgress size={18} sx={{ mx: 0.5 }} />
                    ) : member.comprovantePath ? (
                      <>
                        <Tooltip title="Ver comprovante">
                          <IconButton size="small" sx={{ color: 'success.main', p: 0.5 }} component="a" href={member.comprovantePath} target="_blank" rel="noreferrer">
                            <ReceiptLongIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remover comprovante">
                          <IconButton size="small" sx={{ color: 'text.disabled', p: 0.5 }} onClick={() => handleRemoveMemberComprovante(member._id)}>
                            <AttachFileIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    ) : (
                      <Tooltip title="Anexar comprovante">
                        <IconButton size="small" sx={{ color: 'text.disabled', p: 0.5 }} onClick={() => handleOpenComprovanteDialog(member)}>
                          <AttachFileIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )
                  )}

                  <Tooltip title="Remover">
                    <IconButton size="small" color="error" onClick={() => handleRemove(member._id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
            </Box>
          )}

          {/* Add form */}
          <Divider />
          <Box
            component="form"
            onSubmit={handleAdd}
            sx={{ display: 'flex', gap: 1, p: 2, alignItems: 'flex-start' }}
          >
            <Box sx={{ flex: 1 }}>
              {addError && (
                <Alert severity="error" sx={{ mb: 1 }} onClose={() => setAddError(null)}>
                  {addError}
                </Alert>
              )}
              <TextField
                placeholder="Nome do mensalista"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                size="small"
                fullWidth
              />
            </Box>
            <Button
              type="submit"
              variant="contained"
              startIcon={adding ? <CircularProgress size={16} color="inherit" /> : <PersonAddIcon />}
              disabled={adding}
              sx={{ whiteSpace: 'nowrap', mt: addError ? 5.5 : 0 }}
            >
              Adicionar
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* ── Payment info ──────────────────────────────────────── */}
      <Card sx={{ borderLeft: '5px solid', borderColor: 'secondary.main' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PixIcon color="primary" />
            <Typography variant="h6" fontWeight={700}>
              Informações de Pagamento
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
              gap: 2,
              mb: 2,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>CHAVE PIX (CPF)</Typography>
              <Typography fontWeight={700} sx={{ fontFamily: 'monospace', fontSize: '1.05rem' }}>
                132.873.779-90
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>BANCO</Typography>
              <Typography fontWeight={700}>PagBank</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>TITULAR</Typography>
              <Typography fontWeight={700}>Ryan Eduardo G. Tiblier</Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 1,
            }}
          >
            {[
              { label: 'Horário', value: '22h às 00h (toda sexta)' },
              { label: 'Jogos no mês', value: `${numFridays} jogos` },
              { label: 'Valor da hora', value: 'R$90,00/h' },
              { label: 'Total do mês', value: `R$${totalCost},00 (${MAX_PLAYERS} pessoas)` },
              { label: 'Valor por pessoa', value: `R$${pricePerPerson},00` },
              { label: 'Avulso por jogo', value: `R$${GAME_PRICE},00 → caixa do vôlei (próx. mês)` },
            ].map((item) => (
              <Box
                key={item.label}
                sx={{
                  px: 1.5,
                  py: 0.75,
                  bgcolor: 'background.default',
                  borderRadius: 1,
                }}
              >
                <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">{item.label}</Typography>
                <Typography variant="body2" fontWeight={700}>{item.value}</Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
      {/* ── Comprovante Dialog ───────────────────────────────── */}
      <Dialog open={comprovanteDialog.open} onClose={handleCloseComprovanteDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Anexar Comprovante</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Jogador"
              value={comprovanteDialog.member?.name ?? ''}
              size="small"
              fullWidth
              disabled
            />
            <TextField
              label="Mês / Ano"
              value={`${MONTH_NAMES[month - 1]} ${year}`}
              size="small"
              fullWidth
              disabled
            />
            <Button
              variant="outlined"
              component="label"
              startIcon={<AttachFileIcon />}
              fullWidth
              color={comprovanteFile ? 'success' : 'primary'}
            >
              {comprovanteFile ? comprovanteFile.name : 'Selecionar arquivo (imagem ou PDF)'}
              <input
                type="file"
                hidden
                accept="image/*,application/pdf"
                onChange={(e) => setComprovanteFile(e.target.files?.[0] ?? null)}
              />
            </Button>
            {comprovanteFile && (
              <Typography variant="caption" color="text.secondary">
                {(comprovanteFile.size / 1024).toFixed(0)} KB
              </Typography>
            )}
          </Stack>
        </DialogContent>
        {comprovanteUploadError && (
          <Box sx={{ px: 3, pb: 1 }}>
            <Alert severity="error" onClose={() => setComprovanteUploadError(null)}>{comprovanteUploadError}</Alert>
          </Box>
        )}
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button onClick={handleCloseComprovanteDialog} disabled={comprovanteUploading}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSubmitComprovante}
            disabled={!comprovanteFile || comprovanteUploading}
            startIcon={comprovanteUploading ? <CircularProgress size={14} color="inherit" /> : null}
          >
            {comprovanteUploading ? 'Enviando...' : 'Enviar'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
