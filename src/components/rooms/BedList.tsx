import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  List, ListItem, ListItemText, Chip, IconButton, Box, Typography, TextField
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { Room, Bed } from '../../types';

interface Props {
  room: Room;
  beds: Bed[];
  onClose: () => void;
  onSaved: () => void;
}

export default function BedList({ room, beds, onClose, onSaved }: Props) {
  const [newBedNumber, setNewBedNumber] = useState('');
  const [adding, setAdding] = useState(false);

  async function addBed() {
    if (!newBedNumber.trim()) return;
    setAdding(true);
    await addDoc(collection(db, 'beds'), {
      roomId: room.id,
      bedNumber: newBedNumber.trim(),
      status: 'vacant',
      createdAt: serverTimestamp(),
    });
    setNewBedNumber('');
    setAdding(false);
    onSaved();
  }

  async function deleteBed(bedId: string) {
    await deleteDoc(doc(db, 'beds', bedId));
    onSaved();
  }

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Beds in {room.name}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, mt: 1 }}>
          <TextField
            label="Bed Number/Name"
            value={newBedNumber}
            onChange={e => setNewBedNumber(e.target.value)}
            size="small"
            onKeyDown={e => e.key === 'Enter' && addBed()}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={addBed} disabled={adding || !newBedNumber.trim()}>
            Add
          </Button>
        </Box>
        {beds.length === 0 ? (
          <Typography color="text.secondary">No beds in this room yet.</Typography>
        ) : (
          <List dense>
            {beds.map(bed => (
              <ListItem key={bed.id} divider secondaryAction={
                <IconButton edge="end" size="small" color="error" onClick={() => deleteBed(bed.id)} disabled={bed.status === 'occupied'}>
                  <DeleteIcon />
                </IconButton>
              }>
                <ListItemText primary={`Bed ${bed.bedNumber}`} />
                <Chip
                  label={bed.status}
                  color={bed.status === 'vacant' ? 'success' : 'warning'}
                  size="small"
                  sx={{ mr: 1 }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
