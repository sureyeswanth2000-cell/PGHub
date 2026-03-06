import { useEffect, useState } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const PAGE_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/rooms': 'Rooms & Beds',
  '/residents': 'Residents',
  '/payments': 'Payments',
  '/notifications': 'Notifications',
};

function TopBar() {
  const location = useLocation();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const pageLabel = PAGE_LABELS[location.pathname] || 'PGHub';
  const dateStr = time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <Box sx={{
      height: 64, px: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      bgcolor: 'white',
      borderBottom: '1px solid #f1f5f9',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <Box>
        <Typography variant="h6" fontWeight={700} color="text.primary">{pageLabel}</Typography>
        <Typography variant="caption" color="text.secondary">{dateStr}</Typography>
      </Box>
      <Chip
        icon={<AccessTimeIcon sx={{ fontSize: '14px !important' }} />}
        label={timeStr}
        size="small"
        sx={{
          fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8rem',
          bgcolor: '#f8fafc', border: '1px solid #e2e8f0', color: 'text.secondary',
        }}
      />
    </Box>
  );
}

export default function Layout() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', ml: 0 }}>
        <TopBar />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
