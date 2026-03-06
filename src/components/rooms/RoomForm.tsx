import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid
} from '@mui/material';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { Room } from '../../types';

interface Props {
  open: boolean;
  room: Room | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function RoomForm({ open, room, onClose, onSaved }: Props) {
  const [name, setName] = useState('');
  const [totalBeds, setTotalBeds] = useState(1);
  const [floor, setFloor] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (room) {
      setName(room.name);
      setTotalBeds(room.totalBeds);
      setFloor(room.floor || '');
      setDescription(room.description || '');
    } else {
      setName(''); setTotalBeds(1); setFloor(''); setDescription('');
    }
  }, [room, open]);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    const data = { name: name.trim(), totalBeds, floor: floor.trim(), description: description.trim() };
    if (room) {
      await updateDoc(doc(db, 'rooms', room.id), data);
    } else {
      await addDoc(collection(db, 'rooms'), { ...data, createdAt: serverTimestamp() });
    }
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{room ? 'Edit Room' : 'Add Room'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={12}>
            <TextField label="Room Name" value={name} onChange={e => setName(e.target.value)} fullWidth required />
          </Grid>
          <Grid size={6}>
            <TextField label="Total Beds" type="number" value={totalBeds} onChange={e => setTotalBeds(parseInt(e.target.value) || 1)} fullWidth inputProps={{ min: 1 }} />
          </Grid>
          <Grid size={6}>
            <TextField label="Floor" value={floor} onChange={e => setFloor(e.target.value)} fullWidth />
          </Grid>
          <Grid size={12}>
            <TextField label="Description" value={description} onChange={e => setDescription(e.target.value)} fullWidth multiline rows={2} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || !name.trim()}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
