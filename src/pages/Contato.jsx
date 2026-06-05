import { Box, Typography } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';

export default function Contato() {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <EmailIcon color="primary" sx={{ fontSize: 36 }} />
        <Typography variant="h4" fontWeight={700}>
          Contato
        </Typography>
      </Box>
      <Typography color="text.secondary">
        Em breve — informações de contato e formulário.
      </Typography>
    </Box>
  );
}
