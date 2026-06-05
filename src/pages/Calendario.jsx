import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  LinearProgress,
  IconButton,
  Stack,
  Skeleton,
  Alert,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import GroupIcon from '@mui/icons-material/Group';
import { getSessions, generateSessions } from '../services/api.js';
import { getFridaysOfMonth, isHoliday, MONTH_NAMES } from '../utils/holidays.js';

function getCapacityColor(count, max) {
  const pct = count / max;
  if (pct >= 1) return 'error';
  if (pct >= 0.7) return 'warning';
  return 'success';
}

export default function Calendario() {
  const navigate = useNavigate();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data = await getSessions(month, year);
      if (data.length === 0) {
        await generateSessions(month, year);
        data = await getSessions(month, year);
      }
      setSessions(data);
    } catch {
      setError('Erro ao carregar sessões.');
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

  // Build a map of sessions keyed by dateStr
  const sessionMap = Object.fromEntries(sessions.map((s) => [s.dateStr, s]));

  // All Fridays of the month (client-side)
  const fridays = getFridaysOfMonth(year, month);

  return (
    <Box>
      {/* ── Header ──────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <CalendarMonthIcon color="primary" sx={{ fontSize: 36 }} />
        <Typography variant="h4" fontWeight={700}>
          Calendário
        </Typography>
      </Box>

      {/* ── Month navigation ────────────────────────────────────── */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <IconButton onClick={prevMonth} color="primary">
              <ChevronLeftIcon />
            </IconButton>
            <Box textAlign="center">
              <Typography variant="h5" fontWeight={800}>
                {MONTH_NAMES[month - 1]}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {year}
              </Typography>
            </Box>
            <IconButton onClick={nextMonth} color="primary">
              <ChevronRightIcon />
            </IconButton>
          </Stack>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}



      {/* ── Friday cards ────────────────────────────────────────── */}
      <Stack spacing={2}>
        {loading
          ? [1, 2, 3, 4].map((k) => (
              <Skeleton key={k} variant="rounded" height={120} />
            ))
          : fridays.map((dateStr) => {
              const session = sessionMap[dateStr];
              const holiday = isHoliday(dateStr);
              const isCancelled = session?.isCancelled;
              const count = session?.attendanceCount ?? 0;
              const max = session?.maxPlayers ?? 18;

              const [yr, mo, dy] = dateStr.split('-').map(Number);
              const dateObj = new Date(yr, mo - 1, dy);
              const dayLabel = dateObj.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
              });

              let cardBorderColor = 'primary.main';
              if (isCancelled) cardBorderColor = 'error.main';
              else if (holiday) cardBorderColor = 'warning.main';

              return (
                <Card
                  key={dateStr}
                  sx={{
                    borderLeft: '5px solid',
                    borderColor: cardBorderColor,
                    opacity: isCancelled ? 0.65 : 1,
                  }}
                >
                  <CardActionArea onClick={() => navigate(`/presenca/${dateStr}`)}>
                    <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ sm: 'center' }}
                        gap={1}
                      >
                        {/* Date + chips */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="h6" fontWeight={700} textTransform="capitalize">
                            Sexta · {dayLabel}
                          </Typography>
                          <Stack direction="row" spacing={1} mt={0.5} flexWrap="wrap" useFlexGap>
                            <Chip label="22h – 00h" size="small" color="primary" variant="outlined" />
                            {holiday && (
                              <Chip
                                icon={<WarningAmberIcon />}
                                label={holiday.name}
                                size="small"
                                color="warning"
                              />
                            )}
                            {isCancelled && (
                              <Chip label="Cancelado" size="small" color="error" />
                            )}
                          </Stack>
                        </Box>

                        {/* Attendance */}
                        <Box
                          sx={{
                            textAlign: 'right',
                            flexShrink: 0,
                            alignSelf: { xs: 'flex-end', sm: 'center' },
                          }}
                        >
                          <Typography
                            variant="h5"
                            fontWeight={800}
                            lineHeight={1}
                            color={session ? `${getCapacityColor(count, max)}.main` : 'text.disabled'}
                          >
                            {session ? `${count}/${max}` : '–'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            <GroupIcon sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.3 }} />
                            jogadores
                          </Typography>
                        </Box>
                      </Stack>

                      {/* Progress bar */}
                      {session && !isCancelled && (
                        <Box mt={1.5}>
                          <LinearProgress
                            variant="determinate"
                            value={(count / max) * 100}
                            color={getCapacityColor(count, max)}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      )}

                      {holiday && !isCancelled && (
                        <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
                          ⚠️ Feriado nacional — confirme se haverá jogo
                        </Typography>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              );
            })}
      </Stack>
    </Box>
  );
}
