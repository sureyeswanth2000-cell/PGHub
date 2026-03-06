import { useEffect, useState } from 'react';
import {
  Box, Button, Typography, Card, CardContent, CardActions,
  Grid, IconButton, Chip, Skeleton, Dialog, DialogTitle,
  DialogContent, DialogActions, Stack, Tooltip, LinearProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BedIcon from '@mui/icons-material/Bed';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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

  const totalBeds = beds.length;
  const occupiedBeds = beds.filter(b => b.status === 'occupied').length;

  if (loading) return (
    <Box>
      <Skeleton width={200} height={40} sx={{ mb: 3 }} />
      <Grid container spacing={2.5}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
            <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Rooms & Beds</Typography>
          <Typography variant="body2" color="text.secondary">
            {rooms.length} rooms · {totalBeds} beds · {occupiedBeds} occupied · {totalBeds - occupiedBeds} vacant
          </Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />}
          onClick={() => { setEditRoom(null); setFormOpen(true); }}
          sx={{ borderRadius: 2 }}>
          Add Room
        </Button>
      </Box>

      {rooms.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <MeetingRoomIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
          <Typography color="text.secondary" fontWeight={600}>No rooms yet</Typography>
          <Typography variant="body2" color="text.secondary">Click "Add Room" to create your first room</Typography>
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {rooms.map((room) => {
            const roomBeds = beds.filter(b => b.roomId === room.id);
            const occupied = roomBeds.filter(b => b.status === 'occupied').length;
            const vacant = roomBeds.filter(b => b.status === 'vacant').length;
            const occupancyPct = roomBeds.length ? Math.round((occupied / roomBeds.length) * 100) : 0;
            const isFullyOccupied = roomBeds.length > 0 && occupied === roomBeds.length;

            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={room.id}>
                <Card sx={{
                  height: '100%', borderRadius: 3,
                  border: '1.5px solid',
                  borderColor: isFullyOccupied ? '#fecaca' : vacant === roomBeds.length ? '#bbf7d0' : '#e2e8f0',
                  '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.1)', transform: 'translateY(-2px)' },
                  transition: 'all 0.2s ease',
                  boxShadow: 'none',
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" fontWeight={800}>{room.name}</Typography>
                        {room.floor && <Typography variant="caption" color="text.secondary">Floor {room.floor}</Typography>}
                      </Box>
                      <Box sx={{
                        width: 44, height: 44, borderRadius: 2,
                        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <MeetingRoomIcon sx={{ color: 'white', fontSize: 22 }} />
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>Occupancy</Typography>
                        <Typography variant="caption" fontWeight={700} color={isFullyOccupied ? 'error.main' : 'success.main'}>
                          {occupancyPct}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={occupancyPct}
                        sx={{
                          height: 6, borderRadius: 3,
                          bgcolor: '#f1f5f9',
                          '& .MuiLinearProgress-bar': {
                            background: isFullyOccupied
                              ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                              : 'linear-gradient(90deg, #4f46e5, #7c3aed)',
                            borderRadius: 3,
                          },
                        }}
                      />
                    </Box>

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip icon={<BedIcon sx={{ fontSize: '14px !important' }} />}
                        label={`${roomBeds.length} beds`} size="small"
                        sx={{ fontSize: '0.72rem', bgcolor: '#ede9fe', color: '#5b21b6', fontWeight: 700 }} />
                      <Chip label={`${occupied} occ.`} size="small"
                        sx={{ fontSize: '0.72rem', bgcolor: occupied > 0 ? '#fef9c3' : '#f1f5f9', color: occupied > 0 ? '#854d0e' : '#64748b', fontWeight: 700 }} />
                      <Chip icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                        label={`${vacant} free`} size="small"
                        sx={{ fontSize: '0.72rem', bgcolor: vacant > 0 ? '#dcfce7' : '#f1f5f9', color: vacant > 0 ? '#166534' : '#64748b', fontWeight: 700 }} />
                    </Stack>

                    {room.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, fontSize: '0.8rem' }}>{room.description}</Typography>
                    )}
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1 }}>
                    <Button size="small" variant="outlined" onClick={() => setSelectedRoom(room)} sx={{ borderRadius: 2, fontSize: '0.78rem' }}>
                      Manage Beds
                    </Button>
                    <Box sx={{ flex: 1 }} />
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => { setEditRoom(room); setFormOpen(true); }}
                        sx={{ '&:hover': { color: 'primary.main' } }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => setDeleteConfirm(room.id)}
                        sx={{ '&:hover': { bgcolor: '#fee2e2' } }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
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

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>Delete Room</DialogTitle>
        <DialogContent>Are you sure you want to delete this room? Beds in this room should be removed first.</DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeleteConfirm(null)} variant="outlined">Cancel</Button>
          <Button color="error" variant="contained" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
