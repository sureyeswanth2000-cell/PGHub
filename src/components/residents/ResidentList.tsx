import { useEffect, useState } from 'react';
import {
  Box, Button, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, Skeleton,
  TextField, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions,
  Avatar, Stack, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import HomeIcon from '@mui/icons-material/Home';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BadgeIcon from '@mui/icons-material/Badge';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { Resident, Room, Bed } from '../../types';
import ResidentForm from './ResidentForm';
import { format } from 'date-fns';

const AVATAR_COLORS = ['#4f46e5','#059669','#f59e0b','#06b6d4','#7c3aed','#ef4444','#0ea5e9','#84cc16'];

function getInitials(name: string) {
  return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
}

function exportCSV(residents: Resident[], rooms: Room[], beds: Bed[]) {
  const headers = ['Name','Phone','Email','Room','Bed','Join Date','Status','Address','ID Proof'];
  const rows = residents.map(r => {
    const room = rooms.find(rm => rm.id === r.roomId);
    const bed = beds.find(b => b.id === r.bedId);
    const jd = (r.joinDate as any)?.toDate?.() ?? new Date(r.joinDate);
    return [
      r.name, r.phone, r.email || '', room?.name || '', bed ? `Bed ${bed.bedNumber}` : '',
      format(jd, 'dd/MM/yyyy'), r.status, r.address || '', r.idProof || '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `residents_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

interface ProfileDialogProps {
  resident: Resident | null;
  rooms: Room[];
  beds: Bed[];
  onClose: () => void;
  onEdit: () => void;
}

function ProfileDialog({ resident, rooms, beds, onClose, onEdit }: ProfileDialogProps) {
  if (!resident) return null;
  const room = rooms.find(rm => rm.id === resident.roomId);
  const bed = beds.find(b => b.id === resident.bedId);
  const jd = (resident.joinDate as any)?.toDate?.() ?? new Date(resident.joinDate);
  const idx = resident.name.charCodeAt(0) % AVATAR_COLORS.length;

  const rows = [
    { icon: <PhoneIcon fontSize="small" />, label: 'Phone', value: resident.phone },
    { icon: <EmailIcon fontSize="small" />, label: 'Email', value: resident.email || '—' },
    { icon: <PhoneIcon fontSize="small" />, label: 'Alt. Contact', value: resident.alternateContact || '—' },
    { icon: <HomeIcon fontSize="small" />, label: 'Address', value: resident.address || '—' },
    { icon: <BadgeIcon fontSize="small" />, label: 'ID Proof', value: resident.idProof || '—' },
    { icon: <CalendarTodayIcon fontSize="small" />, label: 'Join Date', value: format(jd, 'dd MMM yyyy') },
    { icon: <HomeIcon fontSize="small" />, label: 'Room', value: room?.name || '—' },
    { icon: <HomeIcon fontSize="small" />, label: 'Bed', value: bed ? `Bed ${bed.bedNumber}` : '—' },
  ];

  return (
    <Dialog open={!!resident} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 4 } }}>
      <Box sx={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', p: 4, textAlign: 'center' }}>
        <Avatar sx={{ width: 72, height: 72, mx: 'auto', mb: 1.5, fontSize: '1.5rem', fontWeight: 800, bgcolor: AVATAR_COLORS[idx], border: '3px solid rgba(255,255,255,0.4)' }}>
          {getInitials(resident.name)}
        </Avatar>
        <Typography variant="h6" fontWeight={800} color="white">{resident.name}</Typography>
        <Chip label={resident.status} size="small" sx={{ mt: 1, bgcolor: resident.status === 'active' ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }} />
      </Box>
      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={1.5}>
          {rows.map(row => (
            <Box key={row.label} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <Box sx={{ color: 'primary.main', mt: 0.2 }}>{row.icon}</Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>{row.label}</Typography>
                <Typography variant="body2" fontWeight={500}>{row.value}</Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined">Close</Button>
        <Button onClick={onEdit} variant="contained">Edit</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ResidentList() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editResident, setEditResident] = useState<Resident | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Resident | null>(null);
  const [profileResident, setProfileResident] = useState<Resident | null>(null);

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

  const filtered = residents.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.phone.includes(search) ||
      rooms.find(rm => rm.id === r.roomId)?.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeCount = residents.filter(r => r.status === 'active').length;
  const inactiveCount = residents.filter(r => r.status === 'inactive').length;

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
          <Typography variant="h5" fontWeight={800}>Residents</Typography>
          <Typography variant="body2" color="text.secondary">{residents.length} total · {activeCount} active · {inactiveCount} inactive</Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={() => exportCSV(filtered, rooms, beds)} sx={{ borderRadius: 2 }}>
            Export CSV
          </Button>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => { setEditResident(null); setFormOpen(true); }} sx={{ borderRadius: 2 }}>
            Add Resident
          </Button>
        </Stack>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search by name, phone, or room..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} /></InputAdornment> } }}
          sx={{ width: 300 }}
          size="small"
        />
        <Stack direction="row" spacing={1}>
          {(['all', 'active', 'inactive'] as const).map(s => (
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
              {['Resident', 'Phone', 'Room & Bed', 'Join Date', 'Status', 'Actions'].map(h => (
                <TableCell key={h} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', py: 1.5 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <PersonIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
                  <Typography color="text.secondary">No residents found.</Typography>
                </TableCell>
              </TableRow>
            ) : filtered.map((r) => {
              const room = rooms.find(rm => rm.id === r.roomId);
              const bed = beds.find(b => b.id === r.bedId);
              const joinDate = (r.joinDate as any)?.toDate?.() ?? new Date(r.joinDate);
              const colorIdx = r.name.charCodeAt(0) % AVATAR_COLORS.length;
              return (
                <TableRow key={r.id} hover sx={{ '&:hover': { bgcolor: '#fafbff' }, cursor: 'pointer' }}
                  onClick={() => setProfileResident(r)}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 36, height: 36, fontSize: '0.8rem', fontWeight: 700, bgcolor: AVATAR_COLORS[colorIdx] }}>
                        {getInitials(r.name)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{r.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{r.email || '—'}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{r.phone}</Typography>
                    {r.alternateContact && <Typography variant="caption" color="text.secondary">{r.alternateContact}</Typography>}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{room?.name || '—'}</Typography>
                    <Typography variant="caption" color="text.secondary">{bed ? `Bed ${bed.bedNumber}` : '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{format(joinDate, 'dd MMM yyyy')}</Typography>
                  </TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Chip
                      label={r.status}
                      size="small"
                      sx={{
                        fontWeight: 700, fontSize: '0.72rem',
                        bgcolor: r.status === 'active' ? '#dcfce7' : '#f1f5f9',
                        color: r.status === 'active' ? '#166534' : '#64748b',
                      }}
                    />
                  </TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => { setEditResident(r); setFormOpen(true); }}
                        sx={{ '&:hover': { color: 'primary.main' } }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => setDeleteConfirm(r)}
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

      <ProfileDialog
        resident={profileResident}
        rooms={rooms}
        beds={beds}
        onClose={() => setProfileResident(null)}
        onEdit={() => { setEditResident(profileResident); setProfileResident(null); setFormOpen(true); }}
      />

      <ResidentForm
        open={formOpen}
        resident={editResident}
        rooms={rooms}
        beds={beds}
        onClose={() => setFormOpen(false)}
        onSaved={fetchData}
      />

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>Remove Resident</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to remove <strong>{deleteConfirm?.name}</strong>? Their bed will be freed.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeleteConfirm(null)} variant="outlined">Cancel</Button>
          <Button color="error" variant="contained" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Remove</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
