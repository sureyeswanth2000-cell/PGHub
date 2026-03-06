import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Grid, MenuItem, Select, InputLabel, FormControl
} from '@mui/material';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { Resident, Room, Bed } from '../../types';

interface Props {
  open: boolean;
  resident: Resident | null;
  rooms: Room[];
  beds: Bed[];
  onClose: () => void;
  onSaved: () => void;
}

export default function ResidentForm({ open, resident, rooms, beds, onClose, onSaved }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [alternateContact, setAlternateContact] = useState('');
  const [idProof, setIdProof] = useState('');
  const [address, setAddress] = useState('');
  const [roomId, setRoomId] = useState('');
  const [bedId, setBedId] = useState('');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [saving, setSaving] = useState(false);

  const availableBeds = beds.filter(b => b.roomId === roomId && (b.status === 'vacant' || b.id === resident?.bedId));

  useEffect(() => {
    if (resident) {
      setName(resident.name); setPhone(resident.phone); setEmail(resident.email || '');
      setAlternateContact(resident.alternateContact || ''); setIdProof(resident.idProof || '');
      setAddress(resident.address || ''); setRoomId(resident.roomId); setBedId(resident.bedId);
      const jd = (resident.joinDate as any)?.toDate?.() || new Date(resident.joinDate);
      setJoinDate(jd.toISOString().split('T')[0]);
      setStatus(resident.status);
    } else {
      setName(''); setPhone(''); setEmail(''); setAlternateContact(''); setIdProof('');
      setAddress(''); setRoomId(''); setBedId('');
      setJoinDate(new Date().toISOString().split('T')[0]); setStatus('active');
    }
  }, [resident, open]);

  async function handleSave() {
    if (!name.trim() || !phone.trim() || !roomId || !bedId) return;
    setSaving(true);
    const data = {
      name: name.trim(), phone: phone.trim(), email: email.trim(),
      alternateContact: alternateContact.trim(), idProof: idProof.trim(),
      address: address.trim(), roomId, bedId,
      joinDate: new Date(joinDate), status,
    };
    if (resident) {
      await updateDoc(doc(db, 'residents', resident.id), data);
      if (resident.bedId !== bedId) {
        await updateDoc(doc(db, 'beds', resident.bedId), { status: 'vacant', residentId: null });
        await updateDoc(doc(db, 'beds', bedId), { status: 'occupied', residentId: resident.id });
      }
    } else {
      const ref = await addDoc(collection(db, 'residents'), { ...data, createdAt: serverTimestamp() });
      await updateDoc(doc(db, 'beds', bedId), { status: 'occupied', residentId: ref.id });
    }
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{resident ? 'Edit Resident' : 'Add Resident'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Full Name *" value={name} onChange={e => setName(e.target.value)} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Phone *" value={phone} onChange={e => setPhone(e.target.value)} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Email" value={email} onChange={e => setEmail(e.target.value)} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Alternate Contact" value={alternateContact} onChange={e => setAlternateContact(e.target.value)} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="ID Proof Number" value={idProof} onChange={e => setIdProof(e.target.value)} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Join Date *" type="date" value={joinDate} onChange={e => setJoinDate(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid size={12}>
            <TextField label="Address" value={address} onChange={e => setAddress(e.target.value)} fullWidth multiline rows={2} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Room *</InputLabel>
              <Select value={roomId} label="Room *" onChange={e => { setRoomId(e.target.value); setBedId(''); }}>
                {rooms.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Bed *</InputLabel>
              <Select value={bedId} label="Bed *" onChange={e => setBedId(e.target.value)} disabled={!roomId}>
                {availableBeds.map(b => <MenuItem key={b.id} value={b.id}>Bed {b.bedNumber}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={status} label="Status" onChange={e => setStatus(e.target.value as 'active' | 'inactive')}>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || !name.trim() || !phone.trim() || !roomId || !bedId}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
