import { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, CircularProgress, List,
  ListItem, ListItemText, Chip, Paper
} from '@mui/material';
import BedIcon from '@mui/icons-material/Bed';
import PeopleIcon from '@mui/icons-material/People';
import PaymentIcon from '@mui/icons-material/Payment';
import WarningIcon from '@mui/icons-material/Warning';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { Bed, Payment, Resident } from '../../types';

interface Stats {
  totalBeds: number;
  occupiedBeds: number;
  vacantBeds: number;
  totalResidents: number;
  paidThisMonth: number;
  overduePayments: number;
  recentResidents: Resident[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [bedsSnap, residentsSnap, paymentsSnap] = await Promise.all([
        getDocs(collection(db, 'beds')),
        getDocs(query(collection(db, 'residents'), where('status', '==', 'active'))),
        getDocs(collection(db, 'payments')),
      ]);

      const beds = bedsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Bed));
      const residents = residentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Resident));
      const payments = paymentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));

      const now = new Date();
      const thisMonth = `${now.getFullYear()}-${now.getMonth()}`;

      setStats({
        totalBeds: beds.length,
        occupiedBeds: beds.filter(b => b.status === 'occupied').length,
        vacantBeds: beds.filter(b => b.status === 'vacant').length,
        totalResidents: residents.length,
        paidThisMonth: payments.filter(p => {
          const pd = (p.paymentDate as any)?.toDate?.() || new Date(p.paymentDate);
          return p.status === 'paid' && `${pd.getFullYear()}-${pd.getMonth()}` === thisMonth;
        }).length,
        overduePayments: payments.filter(p => p.status === 'overdue').length,
        recentResidents: residents.slice(0, 5),
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  const statCards = [
    { label: 'Total Beds', value: stats!.totalBeds, icon: <BedIcon />, color: '#1a237e' },
    { label: 'Occupied Beds', value: stats!.occupiedBeds, icon: <BedIcon />, color: '#388e3c' },
    { label: 'Vacant Beds', value: stats!.vacantBeds, icon: <BedIcon />, color: '#f57c00' },
    { label: 'Active Residents', value: stats!.totalResidents, icon: <PeopleIcon />, color: '#7b1fa2' },
    { label: 'Paid This Month', value: stats!.paidThisMonth, icon: <PaymentIcon />, color: '#0288d1' },
    { label: 'Overdue Payments', value: stats!.overduePayments, icon: <WarningIcon />, color: '#d32f2f' },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>Dashboard</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={card.label}>
            <Card elevation={2}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ color: card.color, fontSize: 40 }}>{card.icon}</Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold">{card.value}</Typography>
                  <Typography variant="body2" color="text.secondary">{card.label}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>Recent Active Residents</Typography>
        {stats!.recentResidents.length === 0 ? (
          <Typography color="text.secondary">No active residents found.</Typography>
        ) : (
          <List dense>
            {stats!.recentResidents.map((r) => (
              <ListItem key={r.id} divider>
                <ListItemText primary={r.name} secondary={r.phone} />
                <Chip label="Active" color="success" size="small" />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}
