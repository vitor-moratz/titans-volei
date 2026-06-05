import { Box, Container, Typography, Link } from '@mui/material';
import SportsVolleyballIcon from '@mui/icons-material/SportsVolleyball';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'primary.dark',
        color: 'white',
        py: 3,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SportsVolleyballIcon sx={{ color: 'secondary.main' }} />
            <Typography variant="subtitle1" fontWeight={700}>
              Titans Vôlei
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            © {new Date().getFullYear()} Titans Vôlei · Desenvolvido por{' '}
            <Link
              href="https://my-portfolio-dj0ckukvl-vitormoratoz.vercel.app/#"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: 'secondary.main', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Moratz Programming
            </Link>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
