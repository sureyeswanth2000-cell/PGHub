import { useEffect, useState } from 'react';
import {
  Box, Button, Typography, Card, CardContent, CardActions,
  Grid, IconButton, Chip, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BedIcon from '@mui/icons-material/Bed';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { Room, Bed } from '../../types';
import RoomForm from './RoomForm';
import BedList from './BedList';

export default function RoomList() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  async function fetchData() {
    const [roomsSnap, bedsSnap] = await Promise.all([
      getDocs(collection(db, 'rooms')),
      getDocs(collection(db, 'beds')),
    ]);
    setRooms(roomsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Room)));
    setBeds(bedsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Bed)));
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function handleDelete(id: string) {
    await deleteDoc(doc(db, 'rooms', id));
    setDeleteConfirm(null);
    fetchData();
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Rooms & Beds</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditRoom(null); setFormOpen(true); }}>
          Add Room
        </Button>
      </Box>

      {rooms.length === 0 ? (
        <Typography color="text.secondary">No rooms added yet. Click "Add Room" to get started.</Typography>
      ) : (
        <Grid container spacing={3}>
          {rooms.map((room) => {
            const roomBeds = beds.filter(b => b.roomId === room.id);
            const occupied = roomBeds.filter(b => b.status === 'occupied').length;
            const vacant = roomBeds.filter(b => b.status === 'vacant').length;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={room.id}>
                <Card elevation={2}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold">{room.name}</Typography>
                    {room.floor && <Typography variant="body2" color="text.secondary">Floor: {room.floor}</Typography>}
                    <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                      <Chip icon={<BedIcon />} label={`${roomBeds.length} beds`} size="small" />
                      <Chip label={`${occupied} occupied`} color="warning" size="small" />
                      <Chip label={`${vacant} vacant`} color="success" size="small" />
                    </Box>
                    {room.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{room.description}</Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => setSelectedRoom(room)}>View Beds</Button>
                    <IconButton size="small" onClick={() => { setEditRoom(room); setFormOpen(true); }}><EditIcon /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteConfirm(room.id)}><DeleteIcon /></IconButton>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <RoomForm open={formOpen} room={editRoom} onClose={() => setFormOpen(false)} onSaved={fetchData} />

      {selectedRoom && (
        <BedList room={selectedRoom} beds={beds.filter(b => b.roomId === selectedRoom.id)} onClose={() => setSelectedRoom(null)} onSaved={fetchData} />
      )}

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Room</DialogTitle>
        <DialogContent>Are you sure you want to delete this room?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button color="error" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
