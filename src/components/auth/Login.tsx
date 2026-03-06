import { Box, Button, Typography, Paper, Stack } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import ApartmentIcon from '@mui/icons-material/Apartment';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import PeopleIcon from '@mui/icons-material/People';
import PaymentIcon from '@mui/icons-material/Payment';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useAuth } from '../../contexts/AuthContext';

const features = [
  { icon: <MeetingRoomIcon sx={{ fontSize: 20 }} />, text: 'Room & Bed Management' },
  { icon: <PeopleIcon sx={{ fontSize: 20 }} />, text: 'Resident Profiles & History' },
  { icon: <PaymentIcon sx={{ fontSize: 20 }} />, text: 'Payments & Finance Tracking' },
  { icon: <NotificationsActiveIcon sx={{ fontSize: 20 }} />, text: 'WhatsApp Reminders' },
];

export default function Login() {
  const { signInWithGoogle } = useAuth();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4f46e5 70%, #7c3aed 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative blobs */}
      <Box sx={{
        position: 'absolute', top: -100, right: -100, width: 400, height: 400,
        borderRadius: '50%', bgcolor: 'rgba(124,58,237,0.3)', filter: 'blur(80px)',
      }} />
      <Box sx={{
        position: 'absolute', bottom: -150, left: -100, width: 500, height: 500,
        borderRadius: '50%', bgcolor: 'rgba(79,70,229,0.3)', filter: 'blur(100px)',
      }} />

      {/* Left panel */}
      <Box sx={{
        flex: 1, display: { xs: 'none', md: 'flex' }, flexDirection: 'column',
        justifyContent: 'center', p: 8, position: 'relative', zIndex: 1,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Box sx={{
            width: 56, height: 56, borderRadius: 3,
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ApartmentIcon sx={{ color: 'white', fontSize: 32 }} />
          </Box>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, letterSpacing: '-1px' }}>
            PGHub
          </Typography>
        </Box>
        <Typography variant="h3" sx={{ color: 'white', fontWeight: 800, lineHeight: 1.2, mb: 2, letterSpacing: '-1.5px' }}>
          Manage your PG<br />
          <Box component="span" sx={{ color: '#fcd34d' }}>smarter & faster</Box>
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', mb: 5, maxWidth: 420 }}>
          A complete solution for PG owners — track rooms, residents, payments, and send automated reminders.
        </Typography>
        <Stack spacing={2}>
          {features.map((f) => (
            <Box key={f.text} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fcd34d',
              }}>
                {f.icon}
              </Box>
              <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{f.text}</Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Right panel - login card */}
      <Box sx={{
        width: { xs: '100%', md: 480 }, display: 'flex', alignItems: 'center',
        justifyContent: 'center', p: 4, position: 'relative', zIndex: 1,
      }}>
        <Paper elevation={0} sx={{
          p: { xs: 4, sm: 6 }, width: '100%', maxWidth: 400,
          borderRadius: 4,
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.3)',
        }}>
          {/* Mobile logo */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 4 }}>
            <ApartmentIcon sx={{ color: 'primary.main', fontSize: 36 }} />
            <Typography variant="h5" fontWeight={800} color="primary.main">PGHub</Typography>
          </Box>

          <Typography variant="h5" fontWeight={700} color="text.primary" gutterBottom>
            Welcome back 👋
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4, fontSize: '0.95rem' }}>
            Sign in to manage your PG accommodation
          </Typography>

          <Button
            variant="contained"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={signInWithGoogle}
            fullWidth
            sx={{
              py: 1.75, fontSize: '1rem', mb: 3,
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              boxShadow: '0 8px 24px rgba(79,70,229,0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)',
                boxShadow: '0 12px 32px rgba(79,70,229,0.45)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Continue with Google
          </Button>

          <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
            By continuing, you agree to our Terms of Service
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
