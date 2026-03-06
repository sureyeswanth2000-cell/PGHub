import { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Skeleton,
  Avatar, Chip, Button, Paper, Divider, Stack, LinearProgress,
} from '@mui/material';
import BedIcon from '@mui/icons-material/Bed';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AddIcon from '@mui/icons-material/Add';
import HotelIcon from '@mui/icons-material/Hotel';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PaymentsIcon from '@mui/icons-material/Payments';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { Bed, Payment, Resident, Room } from '../../types';
import { useNavigate } from 'react-router-dom';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface Stats {
  totalBeds: number;
  occupiedBeds: number;
  vacantBeds: number;
  totalResidents: number;
  monthlyRevenue: number;
  prevMonthRevenue: number;
  overduePayments: number;
  overdueAmount: number;
  recentResidents: Resident[];
  recentPayments: Payment[];
  monthlyData: { month: string; revenue: number }[];
  rooms: Room[];
  beds: Bed[];
}

const GRAD_CARDS = [
  { gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', shadow: 'rgba(79,70,229,0.35)' },
  { gradient: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)', shadow: 'rgba(5,150,105,0.35)' },
  { gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', shadow: 'rgba(245,158,11,0.35)' },
  { gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', shadow: 'rgba(6,182,212,0.35)' },
  { gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', shadow: 'rgba(16,185,129,0.35)' },
  { gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', shadow: 'rgba(239,68,68,0.35)' },
];

const PIE_COLORS = ['#4f46e5', '#e2e8f0'];

function StatCard({
  label, value, sub, icon, gradIdx, trend,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; gradIdx: number; trend?: number;
}) {
  const g = GRAD_CARDS[gradIdx];
  return (
    <Card sx={{
      background: g.gradient,
      boxShadow: `0 8px 24px ${g.shadow}`,
      borderRadius: 3, overflow: 'visible', position: 'relative',
    }}>
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1 }}>
              {label}
            </Typography>
            <Typography sx={{ color: 'white', fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>
              {value}
            </Typography>
            {sub && (
              <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem', mt: 0.5 }}>
                {sub}
              </Typography>
            )}
          </Box>
          <Box sx={{
            width: 48, height: 48, borderRadius: 2.5,
            bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white',
          }}>
            {icon}
          </Box>
        </Box>
        {trend !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5 }}>
            {trend >= 0
              ? <TrendingUpIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.8)' }} />
              : <TrendingDownIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.8)' }} />}
            <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', fontWeight: 600 }}>
              {trend >= 0 ? '+' : ''}{trend.toFixed(0)}% vs last month
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function SkeletonCards() {
  return (
    <Grid container spacing={3}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
          <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} />
        </Grid>
      ))}
    </Grid>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchStats() {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const prevStart = startOfMonth(subMonths(now, 1));
      const prevEnd = endOfMonth(subMonths(now, 1));

      const [bedsSnap, residentsSnap, paymentsSnap, roomsSnap] = await Promise.all([
        getDocs(collection(db, 'beds')),
        getDocs(query(collection(db, 'residents'), where('status', '==', 'active'))),
        getDocs(collection(db, 'payments')),
        getDocs(collection(db, 'rooms')),
      ]);

      const beds = bedsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Bed));
      const residents = residentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Resident));
      const payments = paymentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
      const rooms = roomsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Room));

      const toDate = (v: any): Date => v?.toDate?.() ?? new Date(v);

      const paidPayments = payments.filter(p => p.status === 'paid');
      const monthlyRevenue = paidPayments
        .filter(p => { const d = toDate(p.paymentDate); return d >= monthStart && d <= monthEnd; })
        .reduce((s, p) => s + p.amount, 0);
      const prevMonthRevenue = paidPayments
        .filter(p => { const d = toDate(p.paymentDate); return d >= prevStart && d <= prevEnd; })
        .reduce((s, p) => s + p.amount, 0);

      const overduePayments = payments.filter(p => p.status === 'overdue');
      const overdueAmount = overduePayments.reduce((s, p) => s + p.amount, 0);

      // Last 6 months bar data
      const monthlyData = Array.from({ length: 6 }, (_, i) => {
        const m = subMonths(now, 5 - i);
        const ms = startOfMonth(m), me = endOfMonth(m);
        const rev = paidPayments
          .filter(p => { const d = toDate(p.paymentDate); return d >= ms && d <= me; })
          .reduce((s, p) => s + p.amount, 0);
        return { month: format(m, 'MMM'), revenue: rev };
      });

      // Recent residents (by createdAt desc)
      const sortedResidents = [...residents].sort((a, b) => {
        const ad = toDate(a.createdAt), bd = toDate(b.createdAt);
        return bd.getTime() - ad.getTime();
      });

      // Recent payments
      const sortedPayments = [...paidPayments].sort((a, b) => {
        const ad = toDate(a.paymentDate), bd = toDate(b.paymentDate);
        return bd.getTime() - ad.getTime();
      });

      setStats({
        totalBeds: beds.length,
        occupiedBeds: beds.filter(b => b.status === 'occupied').length,
        vacantBeds: beds.filter(b => b.status === 'vacant').length,
        totalResidents: residents.length,
        monthlyRevenue, prevMonthRevenue, overduePayments: overduePayments.length,
        overdueAmount, rooms, beds,
        recentResidents: sortedResidents.slice(0, 5),
        recentPayments: sortedPayments.slice(0, 5),
        monthlyData,
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  if (loading) return (
    <Box>
      <Skeleton width={200} height={40} sx={{ mb: 3 }} />
      <SkeletonCards />
    </Box>
  );

  const s = stats!;
  const occupancyPct = s.totalBeds ? Math.round((s.occupiedBeds / s.totalBeds) * 100) : 0;
  const revTrend = s.prevMonthRevenue ? ((s.monthlyRevenue - s.prevMonthRevenue) / s.prevMonthRevenue) * 100 : 0;
  const pieData = [
    { name: 'Occupied', value: s.occupiedBeds },
    { name: 'Vacant', value: s.vacantBeds },
  ];

  const statCards = [
    { label: 'Total Beds', value: s.totalBeds, sub: `${occupancyPct}% occupancy`, icon: <HotelIcon />, gradIdx: 0 },
    { label: 'Occupied', value: s.occupiedBeds, sub: `${s.vacantBeds} vacant`, icon: <BedIcon />, gradIdx: 1 },
    { label: 'Active Residents', value: s.totalResidents, sub: 'Currently staying', icon: <PeopleIcon />, gradIdx: 3 },
    {
      label: "This Month's Revenue", value: `₹${s.monthlyRevenue.toLocaleString('en-IN')}`,
      sub: s.prevMonthRevenue ? `Last month ₹${s.prevMonthRevenue.toLocaleString('en-IN')}` : 'No prior data',
      icon: <AttachMoneyIcon />, gradIdx: 4, trend: revTrend,
    },
    { label: 'Overdue Payments', value: s.overduePayments, sub: `₹${s.overdueAmount.toLocaleString('en-IN')} pending`, icon: <WarningAmberIcon />, gradIdx: 5 },
    { label: 'Total Rooms', value: s.rooms.length, sub: 'Configured rooms', icon: <PaymentsIcon />, gradIdx: 2 },
  ];

  return (
    <Box>
      {/* Quick Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} color="text.primary">Overview</Typography>
          <Typography variant="body2" color="text.secondary">Your PG at a glance</Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button size="small" variant="outlined" startIcon={<PersonAddIcon />} onClick={() => navigate('/residents')} sx={{ borderRadius: 2 }}>
            Add Resident
          </Button>
          <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/payments')} sx={{ borderRadius: 2 }}>
            Record Payment
          </Button>
        </Stack>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {statCards.map((c) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={c.label}>
            <StatCard {...c} />
          </Grid>
        ))}
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Revenue Bar Chart */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Revenue — Last 6 Months</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Monthly rent collection (₹)</Typography>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={s.monthlyData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={v => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(v: number | undefined) => [`₹${(v ?? 0).toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Bar dataKey="revenue" radius={[8, 8, 0, 0]}
                  fill="url(#barGrad)" />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Occupancy Pie Chart */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Bed Occupancy</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {occupancyPct}% occupied
            </Typography>
            <LinearProgress
              variant="determinate"
              value={occupancyPct}
              sx={{
                height: 8, borderRadius: 4, mb: 2,
                bgcolor: '#e2e8f0',
                '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #4f46e5, #7c3aed)', borderRadius: 4 },
              }}
            />
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                  paddingAngle={3} dataKey="value" stroke="none">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 12, color: '#64748b' }}>{v}</span>} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Bottom Row — Recent Activity */}
      <Grid container spacing={2.5}>
        {/* Recent Residents */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={700}>Recent Residents</Typography>
              <Button size="small" onClick={() => navigate('/residents')} sx={{ fontSize: '0.75rem' }}>View all</Button>
            </Box>
            {s.recentResidents.length === 0 ? (
              <Typography color="text.secondary" variant="body2">No residents yet.</Typography>
            ) : s.recentResidents.map((r, i) => {
              const initials = r.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
              const colors = ['#4f46e5', '#059669', '#f59e0b', '#06b6d4', '#7c3aed'];
              return (
                <Box key={r.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25 }}>
                    <Avatar sx={{ width: 38, height: 38, fontSize: '0.8rem', fontWeight: 700, bgcolor: colors[i % colors.length] }}>
                      {initials}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>{r.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{r.phone}</Typography>
                    </Box>
                    <Chip label="Active" size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 600, fontSize: '0.7rem' }} />
                  </Box>
                  {i < s.recentResidents.length - 1 && <Divider />}
                </Box>
              );
            })}
          </Paper>
        </Grid>

        {/* Recent Payments */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={700}>Recent Payments</Typography>
              <Button size="small" onClick={() => navigate('/payments')} sx={{ fontSize: '0.75rem' }}>View all</Button>
            </Box>
            {s.recentPayments.length === 0 ? (
              <Typography color="text.secondary" variant="body2">No payments recorded yet.</Typography>
            ) : s.recentPayments.map((p, i) => {
              const pd = (p.paymentDate as any)?.toDate?.() ?? new Date(p.paymentDate);
              return (
                <Box key={p.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25 }}>
                    <Box sx={{
                      width: 38, height: 38, borderRadius: 2,
                      background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <AttachMoneyIcon sx={{ color: '#059669', fontSize: 20 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>{p.residentName}</Typography>
                      <Typography variant="caption" color="text.secondary">{format(pd, 'dd MMM yyyy')} · {p.paymentMode}</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={700} color="success.main">
                      +₹{p.amount.toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                  {i < s.recentPayments.length - 1 && <Divider />}
                </Box>
              );
            })}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
