import { useEffect, useState } from 'react';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Box, Avatar, Badge, Tooltip,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import PeopleIcon from '@mui/icons-material/People';
import PaymentIcon from '@mui/icons-material/Payment';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import ApartmentIcon from '@mui/icons-material/Apartment';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';

export const DRAWER_WIDTH = 256;

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    getDocs(query(collection(db, 'payments'), where('status', '==', 'overdue')))
      .then(snap => setOverdueCount(snap.size))
      .catch(() => {});
  }, []);

  const navItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { label: 'Rooms & Beds', icon: <MeetingRoomIcon />, path: '/rooms' },
    { label: 'Residents', icon: <PeopleIcon />, path: '/residents' },
    { label: 'Payments', icon: <PaymentIcon />, path: '/payments' },
    {
      label: 'Notifications', icon: <NotificationsIcon />, path: '/notifications',
      badge: overdueCount,
    },
  ];

  const initials = (user?.displayName || user?.email || 'U')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 60%, #3730a3 100%)',
          color: 'white',
          border: 'none',
          overflowX: 'hidden',
        },
      }}
    >
      {/* Logo */}
      <Box sx={{ px: 3, py: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: 2.5,
          background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(129,140,248,0.4)',
        }}>
          <ApartmentIcon sx={{ fontSize: 22, color: 'white' }} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={800} sx={{ color: 'white', lineHeight: 1, letterSpacing: '-0.5px' }}>
            PGHub
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>
            Management System
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: 2, mb: 1 }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.08em', fontSize: '0.65rem', textTransform: 'uppercase', px: 1 }}>
          Menu
        </Typography>
      </Box>

      <List sx={{ flex: 1, px: 2 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2.5,
                  px: 2, py: 1.25,
                  background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                  backdropFilter: isActive ? 'blur(10px)' : 'none',
                  border: isActive ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                  '&:hover': { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)' },
                }}
              >
                <ListItemIcon sx={{ color: isActive ? '#a5b4fc' : 'rgba(255,255,255,0.55)', minWidth: 36 }}>
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="error" max={99}>
                      {item.icon}
                    </Badge>
                  ) : item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
                  }}
                />
                {isActive && (
                  <Box sx={{
                    width: 6, height: 6, borderRadius: '50%',
                    bgcolor: '#818cf8', boxShadow: '0 0 8px #818cf8',
                  }} />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* User footer */}
      <Box sx={{
        mx: 2, mb: 2, p: 1.5, borderRadius: 2.5,
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', gap: 1.5,
      }}>
        <Avatar
          src={user?.photoURL || ''}
          sx={{
            width: 36, height: 36, fontSize: '0.8rem', fontWeight: 700,
            background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
            border: '2px solid rgba(255,255,255,0.2)',
          }}
        >
          {initials}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
            {user?.displayName || 'Owner'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.68rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
            {user?.email}
          </Typography>
        </Box>
        <Tooltip title="Sign out">
          <Box
            onClick={logout}
            sx={{
              width: 30, height: 30, borderRadius: 1.5,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', color: 'white' },
              transition: 'all 0.15s',
            }}
          >
            <LogoutIcon sx={{ fontSize: 18 }} />
          </Box>
        </Tooltip>
      </Box>
    </Drawer>
  );
}
