import { Box, Typography } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';

export default function Elenco() {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <GroupIcon color="primary" sx={{ fontSize: 36 }} />
        <Typography variant="h4" fontWeight={700}>
          Elenco
        </Typography>
      </Box>
      <Typography color="text.secondary">
        Em breve — lista de jogadores e comissão técnica.
      </Typography>
    </Box>
  );
}
