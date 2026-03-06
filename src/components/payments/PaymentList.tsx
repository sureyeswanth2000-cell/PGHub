import { useEffect, useState } from 'react';
import {
  Box, Button, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Skeleton,
  TextField, InputAdornment, Stack, Tooltip, Card, CardContent, Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { Payment, Resident } from '../../types';
import PaymentForm from './PaymentForm';
import { format } from 'date-fns';

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  paid:    { bg: '#dcfce7', color: '#166534' },
  unpaid:  { bg: '#fef9c3', color: '#854d0e' },
  overdue: { bg: '#fee2e2', color: '#991b1b' },
};
const TYPE_STYLES: Record<string, { bg: string; color: string }> = {
  rent:    { bg: '#ede9fe', color: '#5b21b6' },
  advance: { bg: '#e0f2fe', color: '#0c4a6e' },
  other:   { bg: '#f1f5f9', color: '#475569' },
};
const MODE_ICONS: Record<string, string> = {
  cash: '💵', online: '📲', cheque: '🏦', other: '💳',
};

function exportCSV(payments: Payment[]) {
  const headers = ['Resident','Amount','Type','Payment Date','Due Date','Mode','Status','Notes'];
  const rows = payments.map(p => {
    const pd = (p.paymentDate as any)?.toDate?.() ?? new Date(p.paymentDate);
    const dd = (p.dueDate as any)?.toDate?.() ?? new Date(p.dueDate);
    return [
      p.residentName, p.amount, p.type,
      format(pd, 'dd/MM/yyyy'), format(dd, 'dd/MM/yyyy'),
      p.paymentMode, p.status, p.notes || '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `payments_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <Card sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid #f1f5f9' }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={800} sx={{ color, mt: 0.5 }}>{value}</Typography>
        {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
      </CardContent>
    </Card>
  );
}

export default function PaymentList() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);

  async function fetchData() {
    const [paymentsSnap, residentsSnap] = await Promise.all([
      getDocs(collection(db, 'payments')),
      getDocs(collection(db, 'residents')),
    ]);
    setPayments(paymentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Payment)));
    setResidents(residentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Resident)));
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function handleDelete(id: string) {
    await deleteDoc(doc(db, 'payments', id));
    fetchData();
  }

  const filtered = payments.filter(p => {
    const matchSearch = p.residentName?.toLowerCase().includes(search.toLowerCase()) ||
      p.type?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalCollected = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalOverdue = payments.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'unpaid').reduce((s, p) => s + p.amount, 0);
  const overdueCount = payments.filter(p => p.status === 'overdue').length;

  if (loading) return (
    <Box>
      <Skeleton width={200} height={40} sx={{ mb: 3 }} />
      {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={60} sx={{ mb: 1, borderRadius: 2 }} />)}
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Payments</Typography>
          <Typography variant="body2" color="text.secondary">{payments.length} records · {overdueCount} overdue</Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={() => exportCSV(filtered)} sx={{ borderRadius: 2 }}>
            Export CSV
          </Button>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => { setEditPayment(null); setFormOpen(true); }} sx={{ borderRadius: 2 }}>
            Add Payment
          </Button>
        </Stack>
      </Box>

      {/* Summary cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard label="Total Collected" value={`₹${totalCollected.toLocaleString('en-IN')}`} sub={`${payments.filter(p=>p.status==='paid').length} payments`} color="#059669" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard label="Overdue Amount" value={`₹${totalOverdue.toLocaleString('en-IN')}`} sub={`${overdueCount} overdue`} color="#ef4444" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard label="Pending Amount" value={`₹${totalPending.toLocaleString('en-IN')}`} sub={`${payments.filter(p=>p.status==='unpaid').length} unpaid`} color="#f59e0b" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard label="Total Records" value={String(payments.length)} sub="All time" color="#4f46e5" />
        </Grid>
      </Grid>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search by resident or type..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} /></InputAdornment> } }}
          sx={{ width: 280 }}
          size="small"
        />
        <Stack direction="row" spacing={1}>
          {(['all', 'paid', 'unpaid', 'overdue'] as const).map(s => (
            <Chip key={s} label={s.charAt(0).toUpperCase() + s.slice(1)}
              onClick={() => setStatusFilter(s)}
              sx={{
                fontWeight: 600, cursor: 'pointer',
                bgcolor: statusFilter === s ? 'primary.main' : 'white',
                color: statusFilter === s ? 'white' : 'text.secondary',
                border: '1px solid',
                borderColor: statusFilter === s ? 'primary.main' : '#e2e8f0',
              }}
            />
          ))}
        </Stack>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              {['Resident', 'Amount', 'Type', 'Payment Date', 'Due Date', 'Mode', 'Status', 'Actions'].map(h => (
                <TableCell key={h} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', py: 1.5 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <ReceiptIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
                  <Typography color="text.secondary">No payments found.</Typography>
                </TableCell>
              </TableRow>
            ) : filtered.map((p) => {
              const payDate = (p.paymentDate as any)?.toDate?.() ?? new Date(p.paymentDate);
              const dueDate = (p.dueDate as any)?.toDate?.() ?? new Date(p.dueDate);
              const isOverdueDate = p.status !== 'paid' && dueDate < new Date();
              const ss = STATUS_STYLES[p.status] || STATUS_STYLES.unpaid;
              const ts = TYPE_STYLES[p.type] || TYPE_STYLES.other;
              return (
                <TableRow key={p.id} hover sx={{ '&:hover': { bgcolor: '#fafbff' } }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{p.residentName}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} color={p.status === 'paid' ? 'success.main' : 'text.primary'}>
                      ₹{p.amount.toLocaleString('en-IN')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={p.type} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem', bgcolor: ts.bg, color: ts.color }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{format(payDate, 'dd MMM yyyy')}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color={isOverdueDate ? 'error.main' : 'text.primary'} fontWeight={isOverdueDate ? 700 : 400}>
                      {format(dueDate, 'dd MMM yyyy')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{MODE_ICONS[p.paymentMode] || ''} {p.paymentMode}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={p.status} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem', bgcolor: ss.bg, color: ss.color }} />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => { setEditPayment(p); setFormOpen(true); }}
                        sx={{ '&:hover': { color: 'primary.main' } }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleDelete(p.id)}
                        sx={{ '&:hover': { color: 'error.main' } }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <PaymentForm
        open={formOpen}
        payment={editPayment}
        residents={residents}
        onClose={() => setFormOpen(false)}
        onSaved={fetchData}
      />
    </Box>
  );
}
