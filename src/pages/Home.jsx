import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GroupIcon from '@mui/icons-material/Group';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PixIcon from '@mui/icons-material/Pix';
import SportsVolleyballIcon from '@mui/icons-material/SportsVolleyball';
import { getNextSession } from '../services/api.js';
import { getNextFriday, isHoliday, formatDatePT, MONTH_NAMES, calcMonthlyValues } from '../utils/holidays.js';

export default function Home() {
  const [nextSession, setNextSession] = useState(null);

  useEffect(() => {
    getNextSession()
      .then(setNextSession)
      .catch(() => setNextSession(null));
  }, []);

  const nextFridayStr = getNextFriday();
  const displayDate = nextSession?.dateStr || nextFridayStr;
  const holidayInfo = isHoliday(displayDate);
  const isCancelled = nextSession?.isCancelled;
  const now = new Date();
  const currentMonthName = MONTH_NAMES[now.getMonth()];
  const { numFridays, totalCost, pricePerPerson, avulsoPrice, maxPlayers } = calcMonthlyValues(
    now.getFullYear(),
    now.getMonth() + 1
  );

  return (
    <Box>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <Box
        sx={{
          borderRadius: 4,
          background: 'linear-gradient(135deg, #000051 0%, #1a237e 50%, #283593 100%)',
          color: 'white',
          py: { xs: 6, md: 9 },
          px: { xs: 3, md: 6 },
          mb: 4,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -40,
            right: -40,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'rgba(253,216,53,0.08)',
            pointerEvents: 'none',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -60,
            left: -60,
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'rgba(253,216,53,0.05)',
            pointerEvents: 'none',
          },
        }}
      >
        <SportsVolleyballIcon sx={{ fontSize: 64, color: 'secondary.main', mb: 1 }} />
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '2.8rem', md: '4rem' },
            fontWeight: 900,
            letterSpacing: 4,
            textTransform: 'uppercase',
            lineHeight: 1,
          }}
        >
          TITANS
        </Typography>
        <Typography
          variant="h4"
          sx={{ fontWeight: 300, letterSpacing: 8, opacity: 0.85, mb: 3 }}
        >
          VÔLEI
        </Typography>

        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: 'rgba(255,255,255,0.1)',
            borderRadius: 3,
            px: 3,
            py: 1,
            mb: 4,
          }}
        >
          <AccessTimeIcon sx={{ color: 'secondary.main', fontSize: 20 }} />
          <Typography variant="subtitle1" fontWeight={600}>
            Toda Sexta-feira · 22h às 00h
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
          <Button
            variant="contained"
            color="secondary"
            size="large"
            component={Link}
            to="/calendario"
            startIcon={<CalendarMonthIcon />}
            sx={{ fontWeight: 700 }}
          >
            Ver Calendário
          </Button>
          <Button
            variant="outlined"
            size="large"
            component={Link}
            to="/mensalistas"
            startIcon={<GroupIcon />}
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
          >
            Mensalistas
          </Button>
        </Stack>
      </Box>

      {/* ── Próxima Sexta ─────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          mb: 3,
        }}
      >
        <Card
          sx={{
            borderLeft: '5px solid',
            borderColor: isCancelled
              ? 'error.main'
              : holidayInfo
              ? 'warning.main'
              : 'secondary.main',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="overline" color="text.secondary" fontWeight={700}>
              Próxima Sexta
            </Typography>
            <Typography variant="h5" fontWeight={800} mt={0.5} textTransform="capitalize">
              {formatDatePT(displayDate)}
            </Typography>
            <Stack direction="row" spacing={1} mt={1.5} flexWrap="wrap" useFlexGap>
              <Chip
                icon={<AccessTimeIcon />}
                label="22h – 00h"
                size="small"
                color="primary"
              />
              {holidayInfo && (
                <Chip
                  icon={<WarningAmberIcon />}
                  label={`Feriado: ${holidayInfo.name}`}
                  size="small"
                  color="warning"
                />
              )}
              {isCancelled && (
                <Chip label="Cancelado" size="small" color="error" />
              )}
              {!holidayInfo && !isCancelled && (
                <Chip label="Confirmado" size="small" color="success" />
              )}
            </Stack>
            {nextSession && (
              <Button
                component={Link}
                to={`/presenca/${nextSession.dateStr}`}
                variant="outlined"
                size="small"
                sx={{ mt: 2 }}
              >
                Ver lista de presença
              </Button>
            )}
          </CardContent>
        </Card>

        {/* ── Stats ─────────────────────────────────────────────── */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="overline" color="text.secondary" fontWeight={700}>
              Informações do Mês — {currentMonthName}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 2,
                mt: 1.5,
              }}
            >
              {[
              { label: 'Jogos', value: numFridays },
              { label: 'Máx. jogadores', value: maxPlayers },
              { label: 'Valor mensal', value: `R$${pricePerPerson}` },
              { label: 'Avulso/jogo', value: `R$${avulsoPrice}`, note: '→ caixa do vôlei' },
              ].map((stat) => (
                <Box
                  key={stat.label}
                  sx={{
                    textAlign: 'center',
                    py: 1.5,
                    bgcolor: 'background.default',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="h5" fontWeight={800} color="primary">
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stat.label}
                  </Typography>
                  {stat.note && (
                    <Typography variant="caption" color="warning.main" fontWeight={600} display="block">
                      {stat.note}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* ── PIX / Pagamento ──────────────────────────────────────── */}
      <Card sx={{ borderLeft: '5px solid', borderColor: 'primary.main' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PixIcon color="primary" />
            <Typography variant="h6" fontWeight={700}>
              Dados para Pagamento
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                CHAVE PIX (CPF)
              </Typography>
              <Typography variant="body1" fontWeight={700} sx={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>
                132.873.779-90
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                BANCO
              </Typography>
              <Typography variant="body1" fontWeight={700}>
                PagBank
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                TITULAR
              </Typography>
              <Typography variant="body1" fontWeight={700}>
                Ryan Eduardo G. Tiblier
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
            <Typography variant="body2" color="text.secondary">
              <b>Mensal:</b> R${pricePerPerson},00/pessoa &nbsp;·&nbsp; R${totalCost},00 total ({maxPlayers} pessoas, {numFridays} jogos)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <b>Avulso:</b> R${avulsoPrice},00/jogo &nbsp;·&nbsp; vai direto para o <b>caixa do vôlei</b> (usado no próximo mês)
            </Typography>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <Button
              component={Link}
              to="/comprovantes"
              variant="contained"
              startIcon={<ReceiptIcon />}
              size="small"
            >
              Enviar Comprovante
            </Button>
            <Button
              component={Link}
              to="/mensalistas"
              variant="outlined"
              startIcon={<GroupIcon />}
              size="small"
            >
              Lista Mensal
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

