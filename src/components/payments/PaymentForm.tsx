import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Grid, MenuItem, Select, InputLabel, FormControl
} from '@mui/material';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { Payment, Resident } from '../../types';

interface Props {
  open: boolean;
  payment: Payment | null;
  residents: Resident[];
  onClose: () => void;
  onSaved: () => void;
}

export default function PaymentForm({ open, payment, residents, onClose, onSaved }: Props) {
  const [residentId, setResidentId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'online' | 'cheque' | 'other'>('cash');
  const [type, setType] = useState<'rent' | 'advance' | 'other'>('rent');
  const [status, setStatus] = useState<'paid' | 'unpaid' | 'overdue'>('paid');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (payment) {
      setResidentId(payment.residentId); setAmount(String(payment.amount));
      const pd = (payment.paymentDate as any)?.toDate?.() || new Date(payment.paymentDate);
      const dd = (payment.dueDate as any)?.toDate?.() || new Date(payment.dueDate);
      setPaymentDate(pd.toISOString().split('T')[0]);
      setDueDate(dd.toISOString().split('T')[0]);
      setPaymentMode(payment.paymentMode); setType(payment.type);
      setStatus(payment.status); setNotes(payment.notes || '');
    } else {
      setResidentId(''); setAmount('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      const next = new Date(); next.setMonth(next.getMonth() + 1);
      setDueDate(next.toISOString().split('T')[0]);
      setPaymentMode('cash'); setType('rent'); setStatus('paid'); setNotes('');
    }
  }, [payment, open]);

  async function handleSave() {
    if (!residentId || !amount || !dueDate) return;
    setSaving(true);
    const resident = residents.find(r => r.id === residentId);
    const data = {
      residentId, residentName: resident?.name || '',
      amount: parseFloat(amount), paymentDate: new Date(paymentDate),
      dueDate: new Date(dueDate), paymentMode, type, status, notes: notes.trim(),
    };
    if (payment) {
      await updateDoc(doc(db, 'payments', payment.id), data);
    } else {
      await addDoc(collection(db, 'payments'), { ...data, createdAt: serverTimestamp() });
    }
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{payment ? 'Edit Payment' : 'Add Payment'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={12}>
            <FormControl fullWidth>
              <InputLabel>Resident *</InputLabel>
              <Select value={residentId} label="Resident *" onChange={e => setResidentId(e.target.value)}>
                {residents.filter(r => r.status === 'active').map(r => (
                  <MenuItem key={r.id} value={r.id}>{r.name} ({r.phone})</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={6}>
            <TextField label="Amount (₹) *" type="number" value={amount} onChange={e => setAmount(e.target.value)} fullWidth />
          </Grid>
          <Grid size={6}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select value={type} label="Type" onChange={e => setType(e.target.value as any)}>
                <MenuItem value="rent">Rent</MenuItem>
                <MenuItem value="advance">Advance</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={6}>
            <TextField label="Payment Date *" type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid size={6}>
            <TextField label="Due Date *" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid size={6}>
            <FormControl fullWidth>
              <InputLabel>Payment Mode</InputLabel>
              <Select value={paymentMode} label="Payment Mode" onChange={e => setPaymentMode(e.target.value as any)}>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="online">Online</MenuItem>
                <MenuItem value="cheque">Cheque</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={status} label="Status" onChange={e => setStatus(e.target.value as any)}>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="unpaid">Unpaid</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={12}>
            <TextField label="Notes" value={notes} onChange={e => setNotes(e.target.value)} fullWidth multiline rows={2} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || !residentId || !amount || !dueDate}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
