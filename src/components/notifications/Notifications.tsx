import { useEffect, useState } from 'react';
import {
  Box, Typography, List, ListItem, ListItemText, ListItemAvatar,
  Avatar, Button, CircularProgress, Paper
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { Payment, Resident } from '../../types';

interface ResidentPaymentStatus {
  resident: Resident;
  lastPayment?: Payment;
  isOverdue: boolean;
  isDueSoon: boolean;
}

export default function Notifications() {
  const [statuses, setStatuses] = useState<ResidentPaymentStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [residentsSnap, paymentsSnap] = await Promise.all([
        getDocs(query(collection(db, 'residents'), where('status', '==', 'active'))),
        getDocs(collection(db, 'payments')),
      ]);
      const residents = residentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Resident));
      const payments = paymentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));

      const now = new Date();
      const soonThreshold = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

      const result: ResidentPaymentStatus[] = residents.map(resident => {
        const residentPayments = payments.filter(p => p.residentId === resident.id);
        const lastPayment = residentPayments.sort((a, b) => {
          const ad = (a.paymentDate as any)?.toDate?.() || new Date(a.paymentDate);
          const bd = (b.paymentDate as any)?.toDate?.() || new Date(b.paymentDate);
          return bd.getTime() - ad.getTime();
        })[0];

        const isOverdue = residentPayments.some(p => p.status === 'overdue');
        const isDueSoon = residentPayments.some(p => {
          if (p.status === 'paid') return false;
          const dd = (p.dueDate as any)?.toDate?.() || new Date(p.dueDate);
          return dd <= soonThreshold && dd >= now;
        });

        return { resident, lastPayment, isOverdue, isDueSoon };
      });

      setStatuses(result);
      setLoading(false);
    }
    fetchData();
  }, []);

  function openWhatsApp(phone: string, message: string) {
    const cleaned = phone.replace(/\D/g, '');
    const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  function getReminderMessage(s: ResidentPaymentStatus) {
    if (s.isOverdue) {
      return `Dear ${s.resident.name}, your rent payment is overdue. Please make the payment at your earliest convenience. Thank you! - PGHub Management`;
    }
    return `Dear ${s.resident.name}, your rent payment is due soon. Please make the payment on time. Thank you! - PGHub Management`;
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  const overdueList = statuses.filter(s => s.isOverdue);
  const dueSoonList = statuses.filter(s => s.isDueSoon && !s.isOverdue);
  const okList = statuses.filter(s => !s.isOverdue && !s.isDueSoon);

  const ResidentItem = ({ s, variant }: { s: ResidentPaymentStatus; variant: 'overdue' | 'due' | 'ok' }) => (
    <ListItem divider>
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: variant === 'overdue' ? 'error.main' : variant === 'due' ? 'warning.main' : 'success.main' }}>
          {variant === 'ok' ? <CheckCircleIcon /> : <WarningIcon />}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={s.resident.name}
        secondary={`Phone: ${s.resident.phone}`}
      />
      {variant !== 'ok' && (
        <Button
          size="small"
          variant="outlined"
          color="success"
          startIcon={<WhatsAppIcon />}
          onClick={() => openWhatsApp(s.resident.phone, getReminderMessage(s))}
          sx={{ mr: 1 }}
        >
          WhatsApp
        </Button>
      )}
    </ListItem>
  );

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>Notifications</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Send payment reminders to residents via WhatsApp. Click "WhatsApp" to open a pre-filled message.
      </Typography>

      {overdueList.length > 0 && (
        <Paper elevation={2} sx={{ mb: 3 }}>
          <Box sx={{ p: 2, bgcolor: '#ffebee', borderRadius: '4px 4px 0 0' }}>
            <Typography variant="h6" fontWeight="bold" color="error">
              Overdue Payments ({overdueList.length})
            </Typography>
          </Box>
          <List dense>
            {overdueList.map(s => <ResidentItem key={s.resident.id} s={s} variant="overdue" />)}
          </List>
        </Paper>
      )}

      {dueSoonList.length > 0 && (
        <Paper elevation={2} sx={{ mb: 3 }}>
          <Box sx={{ p: 2, bgcolor: '#fff8e1', borderRadius: '4px 4px 0 0' }}>
            <Typography variant="h6" fontWeight="bold" color="warning.dark">
              Due Soon (within 5 days) ({dueSoonList.length})
            </Typography>
          </Box>
          <List dense>
            {dueSoonList.map(s => <ResidentItem key={s.resident.id} s={s} variant="due" />)}
          </List>
        </Paper>
      )}

      <Paper elevation={2}>
        <Box sx={{ p: 2, bgcolor: '#e8f5e9', borderRadius: '4px 4px 0 0' }}>
          <Typography variant="h6" fontWeight="bold" color="success.dark">
            All Clear ({okList.length})
          </Typography>
        </Box>
        {okList.length === 0 ? (
          <Box sx={{ p: 2 }}><Typography color="text.secondary">No residents with up-to-date payments.</Typography></Box>
        ) : (
          <List dense>
            {okList.map(s => <ResidentItem key={s.resident.id} s={s} variant="ok" />)}
          </List>
        )}
      </Paper>
    </Box>
  );
}
