import { useEffect, useState } from 'react';
import {
  Box, Typography, Avatar, Button, Chip, Skeleton, Paper,
  Grid, Stack, Tooltip,
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SendIcon from '@mui/icons-material/Send';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { Payment, Resident } from '../../types';
import { differenceInDays } from 'date-fns';

interface ResidentPaymentStatus {
  resident: Resident;
  lastPayment?: Payment;
  isOverdue: boolean;
  isDueSoon: boolean;
  daysOverdue?: number;
  dueIn?: number;
}

const AVATAR_COLORS = ['#4f46e5','#059669','#f59e0b','#06b6d4','#7c3aed','#ef4444'];

function getInitials(name: string) {
  return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
}

function openWhatsApp(phone: string, message: string) {
  const cleaned = phone.replace(/\D/g, '');
  window.open(`https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`, '_blank');
}

function getReminderMsg(s: ResidentPaymentStatus) {
  if (s.isOverdue) {
    return `Dear ${s.resident.name}, your rent payment is overdue by ${s.daysOverdue ?? 0} day(s). Please clear the dues at the earliest. Thank you! — PGHub Management`;
  }
  return `Dear ${s.resident.name}, your rent payment is due in ${s.dueIn ?? 0} day(s). Please make the payment on time to avoid late fees. Thank you! — PGHub Management`;
}

function sendBulkWhatsApp(list: ResidentPaymentStatus[]) {
  list.forEach((s, i) => {
    setTimeout(() => openWhatsApp(s.resident.phone, getReminderMsg(s)), i * 800);
  });
}

interface ResidentCardProps {
  s: ResidentPaymentStatus;
  variant: 'overdue' | 'due' | 'ok';
}

function ResidentCard({ s, variant }: ResidentCardProps) {
  const colorIdx = s.resident.name.charCodeAt(0) % AVATAR_COLORS.length;
  const borderColor = variant === 'overdue' ? '#fecaca' : variant === 'due' ? '#fde68a' : '#bbf7d0';
  const badgeBg = variant === 'overdue' ? '#fee2e2' : variant === 'due' ? '#fef9c3' : '#dcfce7';
  const badgeColor = variant === 'overdue' ? '#991b1b' : variant === 'due' ? '#854d0e' : '#166534';
  const label = variant === 'overdue'
    ? `${s.daysOverdue}d overdue`
    : variant === 'due'
    ? `Due in ${s.dueIn}d`
    : 'Up to date';

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 2, p: 2,
      borderRadius: 2.5, border: `1.5px solid ${borderColor}`,
      bgcolor: 'white', transition: 'all 0.15s',
      '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)', transform: 'translateY(-1px)' },
    }}>
      <Avatar sx={{ width: 44, height: 44, fontWeight: 700, fontSize: '0.9rem', bgcolor: AVATAR_COLORS[colorIdx] }}>
        {getInitials(s.resident.name)}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={700} noWrap>{s.resident.name}</Typography>
        <Typography variant="caption" color="text.secondary">{s.resident.phone}</Typography>
      </Box>
      <Chip label={label} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem', bgcolor: badgeBg, color: badgeColor, flexShrink: 0 }} />
      {variant !== 'ok' && (
        <Tooltip title="Send WhatsApp reminder">
          <Button
            size="small"
            variant="contained"
            startIcon={<WhatsAppIcon sx={{ fontSize: '16px !important' }} />}
            onClick={() => openWhatsApp(s.resident.phone, getReminderMsg(s))}
            sx={{
              bgcolor: '#25d366', '&:hover': { bgcolor: '#1da851' },
              fontSize: '0.75rem', py: 0.5, px: 1.5, borderRadius: 2, flexShrink: 0,
            }}
          >
            Remind
          </Button>
        </Tooltip>
      )}
    </Box>
  );
}

interface SectionProps {
  title: string;
  subtitle: string;
  count: number;
  icon: React.ReactNode;
  iconBg: string;
  items: ResidentPaymentStatus[];
  variant: 'overdue' | 'due' | 'ok';
  onBulk?: () => void;
}

function Section({ title, subtitle, count, icon, iconBg, items, variant, onBulk }: SectionProps) {
  if (items.length === 0) return null;
  return (
    <Paper sx={{ p: 0, overflow: 'hidden', mb: 3 }}>
      <Box sx={{ p: 3, background: iconBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {icon}
          <Box>
            <Typography fontWeight={800} fontSize="1rem">{title}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>{subtitle} · {count} resident{count !== 1 ? 's' : ''}</Typography>
          </Box>
        </Box>
        {onBulk && count > 1 && (
          <Button
            size="small"
            variant="contained"
            startIcon={<SendIcon sx={{ fontSize: '14px !important' }} />}
            onClick={onBulk}
            sx={{
              bgcolor: '#25d366', '&:hover': { bgcolor: '#1da851' },
              fontSize: '0.78rem', borderRadius: 2,
            }}
          >
            Send All ({count})
          </Button>
        )}
      </Box>
      <Box sx={{ p: 2.5 }}>
        <Stack spacing={1.5}>
          {items.map((s) => <ResidentCard key={s.resident.id} s={s} variant={variant} />)}
        </Stack>
      </Box>
    </Paper>
  );
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
      const soonThreshold = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const result: ResidentPaymentStatus[] = residents.map(resident => {
        const rp = payments.filter(p => p.residentId === resident.id);
        const sorted = [...rp].sort((a, b) => {
          const ad = (a.paymentDate as any)?.toDate?.() ?? new Date(a.paymentDate);
          const bd = (b.paymentDate as any)?.toDate?.() ?? new Date(b.paymentDate);
          return bd.getTime() - ad.getTime();
        });
        const lastPayment = sorted[0];

        const overduePayment = rp.find(p => p.status === 'overdue');
        const isOverdue = !!overduePayment;
        let daysOverdue: number | undefined;
        if (overduePayment) {
          const dd = (overduePayment.dueDate as any)?.toDate?.() ?? new Date(overduePayment.dueDate);
          daysOverdue = Math.max(0, differenceInDays(now, dd));
        }

        const dueSoonPayment = !isOverdue ? rp.find(p => {
          if (p.status === 'paid') return false;
          const dd = (p.dueDate as any)?.toDate?.() ?? new Date(p.dueDate);
          return dd <= soonThreshold && dd >= now;
        }) : undefined;
        const isDueSoon = !!dueSoonPayment;
        let dueIn: number | undefined;
        if (dueSoonPayment) {
          const dd = (dueSoonPayment.dueDate as any)?.toDate?.() ?? new Date(dueSoonPayment.dueDate);
          dueIn = differenceInDays(dd, now);
        }

        return { resident, lastPayment, isOverdue, isDueSoon, daysOverdue, dueIn };
      });

      setStatuses(result);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return (
    <Box>
      <Skeleton width={250} height={40} sx={{ mb: 2 }} />
      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={80} sx={{ mb: 1.5, borderRadius: 2 }} />)}
    </Box>
  );

  const overdueList = statuses.filter(s => s.isOverdue);
  const dueSoonList = statuses.filter(s => s.isDueSoon && !s.isOverdue);
  const okList = statuses.filter(s => !s.isOverdue && !s.isDueSoon);
  const totalAlert = overdueList.length + dueSoonList.length;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h5" fontWeight={800}>Notifications</Typography>
          {totalAlert > 0 && (
            <Chip label={`${totalAlert} need attention`} size="small"
              sx={{ bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 700 }} />
          )}
        </Box>
        <Typography variant="body2" color="text.secondary">
          Send WhatsApp reminders · Click individual or bulk send
        </Typography>
      </Box>

      {/* Summary strip */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Overdue', count: overdueList.length, bg: '#fee2e2', color: '#991b1b' },
          { label: 'Due Soon (7 days)', count: dueSoonList.length, bg: '#fef9c3', color: '#854d0e' },
          { label: 'All Clear', count: okList.length, bg: '#dcfce7', color: '#166534' },
        ].map(s => (
          <Grid size={{ xs: 12, sm: 4 }} key={s.label}>
            <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: s.bg, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={800} sx={{ color: s.color }}>{s.count}</Typography>
              <Typography variant="caption" sx={{ color: s.color, fontWeight: 600 }}>{s.label}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Section
        title="Overdue Payments"
        subtitle="Immediate action required"
        count={overdueList.length}
        icon={<WarningAmberIcon sx={{ color: '#991b1b' }} />}
        iconBg="linear-gradient(135deg, #fee2e2, #fecaca)"
        items={overdueList}
        variant="overdue"
        onBulk={() => sendBulkWhatsApp(overdueList)}
      />

      <Section
        title="Due Soon"
        subtitle="Within the next 7 days"
        count={dueSoonList.length}
        icon={<AccessTimeIcon sx={{ color: '#854d0e' }} />}
        iconBg="linear-gradient(135deg, #fef9c3, #fde68a)"
        items={dueSoonList}
        variant="due"
        onBulk={() => sendBulkWhatsApp(dueSoonList)}
      />

      {okList.length > 0 && (
        <Paper sx={{ p: 0, overflow: 'hidden' }}>
          <Box sx={{ p: 3, background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CheckCircleOutlineIcon sx={{ color: '#166534' }} />
            <Box>
              <Typography fontWeight={800} fontSize="1rem">All Clear</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>No pending or overdue payments · {okList.length} resident{okList.length !== 1 ? 's' : ''}</Typography>
            </Box>
          </Box>
          <Box sx={{ p: 2.5 }}>
            <Stack spacing={1.5}>
              {okList.map((s) => <ResidentCard key={s.resident.id} s={s} variant="ok" />)}
            </Stack>
          </Box>
        </Paper>
      )}

      {statuses.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 64, color: '#86efac', mb: 2 }} />
          <Typography color="text.secondary">No active residents found.</Typography>
        </Box>
      )}
    </Box>
  );
}
