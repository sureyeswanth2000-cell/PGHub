import { useEffect, useState } from 'react';
import {
  Box, Button, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, CircularProgress,
  TextField, InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { Payment, Resident } from '../../types';
import PaymentForm from './PaymentForm';

export default function PaymentList() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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

  const filtered = payments.filter(p =>
    p.residentName?.toLowerCase().includes(search.toLowerCase()) ||
    p.type?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (s: string) => s === 'paid' ? 'success' : s === 'overdue' ? 'error' : 'warning';

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Payments</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditPayment(null); setFormOpen(true); }}>
          Add Payment
        </Button>
      </Box>

      <TextField
        placeholder="Search by resident or type..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        sx={{ mb: 2, width: 320 }}
        size="small"
      />

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#1a237e' }}>
              {['Resident', 'Amount', 'Type', 'Payment Date', 'Due Date', 'Mode', 'Status', 'Actions'].map(h => (
                <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold' }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} align="center">No payments found.</TableCell></TableRow>
            ) : filtered.map((p) => {
              const payDate = (p.paymentDate as any)?.toDate?.() || new Date(p.paymentDate);
              const dueDate = (p.dueDate as any)?.toDate?.() || new Date(p.dueDate);
              return (
                <TableRow key={p.id} hover>
                  <TableCell>{p.residentName}</TableCell>
                  <TableCell>₹{p.amount.toLocaleString()}</TableCell>
                  <TableCell><Chip label={p.type} size="small" /></TableCell>
                  <TableCell>{payDate.toLocaleDateString()}</TableCell>
                  <TableCell>{dueDate.toLocaleDateString()}</TableCell>
                  <TableCell>{p.paymentMode}</TableCell>
                  <TableCell><Chip label={p.status} color={statusColor(p.status) as any} size="small" /></TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => { setEditPayment(p); setFormOpen(true); }}><EditIcon /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(p.id)}><DeleteIcon /></IconButton>
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
