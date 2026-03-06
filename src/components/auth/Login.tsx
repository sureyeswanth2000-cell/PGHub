import { Box, Button, Container, Typography, Paper } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import ApartmentIcon from '@mui/icons-material/Apartment';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const { signInWithGoogle } = useAuth();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 6, width: '100%', textAlign: 'center' }}>
          <ApartmentIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            PGHub
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            PG Management System — Manage rooms, residents, and payments with ease
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={signInWithGoogle}
            fullWidth
            sx={{ py: 1.5 }}
          >
            Sign in with Google
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}
