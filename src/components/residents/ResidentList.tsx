import { useEffect, useState } from 'react';
import {
  Box, Button, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, CircularProgress,
  TextField, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { Resident, Room, Bed } from '../../types';
import ResidentForm from './ResidentForm';

export default function ResidentList() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editResident, setEditResident] = useState<Resident | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Resident | null>(null);

  async function fetchData() {
    const [residentsSnap, roomsSnap, bedsSnap] = await Promise.all([
      getDocs(collection(db, 'residents')),
      getDocs(collection(db, 'rooms')),
      getDocs(collection(db, 'beds')),
    ]);
    setResidents(residentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Resident)));
    setRooms(roomsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Room)));
    setBeds(bedsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Bed)));
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function handleDelete(resident: Resident) {
    await deleteDoc(doc(db, 'residents', resident.id));
    if (resident.bedId) {
      await updateDoc(doc(db, 'beds', resident.bedId), { status: 'vacant', residentId: null });
    }
    setDeleteConfirm(null);
    fetchData();
  }

  const filtered = residents.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.phone.includes(search) ||
    rooms.find(rm => rm.id === r.roomId)?.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Residents</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditResident(null); setFormOpen(true); }}>
          Add Resident
        </Button>
      </Box>

      <TextField
        placeholder="Search by name, phone, or room..."
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
              {['Name', 'Phone', 'Room', 'Bed', 'Join Date', 'Status', 'Actions'].map(h => (
                <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold' }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center">No residents found.</TableCell></TableRow>
            ) : filtered.map((r) => {
              const room = rooms.find(rm => rm.id === r.roomId);
              const bed = beds.find(b => b.id === r.bedId);
              const joinDate = (r.joinDate as any)?.toDate?.() || new Date(r.joinDate);
              return (
                <TableRow key={r.id} hover>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.phone}</TableCell>
                  <TableCell>{room?.name || '-'}</TableCell>
                  <TableCell>{bed ? `Bed ${bed.bedNumber}` : '-'}</TableCell>
                  <TableCell>{joinDate.toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip label={r.status} color={r.status === 'active' ? 'success' : 'default'} size="small" />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => { setEditResident(r); setFormOpen(true); }}><EditIcon /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteConfirm(r)}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <ResidentForm
        open={formOpen}
        resident={editResident}
        rooms={rooms}
        beds={beds}
        onClose={() => setFormOpen(false)}
        onSaved={fetchData}
      />

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Remove Resident</DialogTitle>
        <DialogContent>Are you sure you want to remove {deleteConfirm?.name}?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button color="error" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Remove</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
