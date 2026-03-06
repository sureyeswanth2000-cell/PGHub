import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Users, UserCheck, Phone } from 'lucide-react';
import type { Resident, Room, Bed } from '../types';
import {
  getResidents,
  addResident,
  updateResident,
  deleteResident,
  moveOutResident,
  getRooms,
  getBeds,
} from '../services/db';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import SearchBar from '../components/common/SearchBar';
import { formatDate, formatCurrency } from '../utils/helpers';

interface ResidentFormData {
  name: string;
  phone: string;
  email: string;
  alternateContact: string;
  idProofNumber: string;
  address: string;
  roomId: string;
  bedId: string;
  joinDate: string;
  monthlyRent: number;
}

function ResidentForm({
  initial,
  rooms,
  beds,
  onSave,
  onCancel,
  loading,
}: {
  initial?: Partial<ResidentFormData>;
  rooms: Room[];
  beds: Bed[];
  onSave: (data: ResidentFormData) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<ResidentFormData>({
    name: initial?.name ?? '',
    phone: initial?.phone ?? '',
    email: initial?.email ?? '',
    alternateContact: initial?.alternateContact ?? '',
    idProofNumber: initial?.idProofNumber ?? '',
    address: initial?.address ?? '',
    roomId: initial?.roomId ?? '',
    bedId: initial?.bedId ?? '',
    joinDate: initial?.joinDate ?? new Date().toISOString().split('T')[0],
    monthlyRent: initial?.monthlyRent ?? 0,
  });

  const availableBeds = beds.filter(
    (b) => b.roomId === form.roomId && (b.status === 'vacant' || b.id === initial?.bedId)
  );

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input-field"
            placeholder="Resident's full name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="input-field"
            placeholder="+91 9876543210"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="input-field"
            placeholder="resident@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Contact</label>
          <input
            type="tel"
            value={form.alternateContact}
            onChange={(e) => setForm({ ...form, alternateContact: e.target.value })}
            className="input-field"
            placeholder="Emergency contact"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID Proof Number</label>
          <input
            type="text"
            value={form.idProofNumber}
            onChange={(e) => setForm({ ...form, idProofNumber: e.target.value })}
            className="input-field"
            placeholder="Aadhaar/PAN/Passport"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="input-field resize-none"
            rows={2}
            placeholder="Permanent address"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Room *</label>
          <select
            value={form.roomId}
            onChange={(e) => setForm({ ...form, roomId: e.target.value, bedId: '' })}
            className="input-field"
          >
            <option value="">Select Room</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bed *</label>
          <select
            value={form.bedId}
            onChange={(e) => setForm({ ...form, bedId: e.target.value })}
            className="input-field"
            disabled={!form.roomId}
          >
            <option value="">Select Bed</option>
            {availableBeds.map((b) => (
              <option key={b.id} value={b.id}>{b.bedNumber}</option>
            ))}
          </select>
          {form.roomId && availableBeds.length === 0 && (
            <p className="text-xs text-red-500 mt-1">No vacant beds in this room</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Join Date *</label>
          <input
            type="date"
            value={form.joinDate}
            onChange={(e) => setForm({ ...form, joinDate: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent (₹) *</label>
          <input
            type="number"
            min={0}
            value={form.monthlyRent}
            onChange={(e) => setForm({ ...form, monthlyRent: parseFloat(e.target.value) || 0 })}
            className="input-field"
            placeholder="Monthly rent amount"
          />
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button onClick={onCancel} className="btn-secondary" disabled={loading}>Cancel</button>
        <button
          onClick={() => { if (form.name && form.roomId && form.bedId) onSave(form); }}
          className="btn-primary"
          disabled={loading || !form.name || !form.roomId || !form.bedId}
        >
          {loading ? 'Saving...' : 'Save Resident'}
        </button>
      </div>
    </div>
  );
}

export default function ResidentsPage() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [roomFilter, setRoomFilter] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [deletingResident, setDeletingResident] = useState<Resident | null>(null);
  const [moveOutResident_, setMoveOutResident_] = useState<Resident | null>(null);
  const [moveOutDate, setMoveOutDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [viewResident, setViewResident] = useState<Resident | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [res, rm, b] = await Promise.all([getResidents(), getRooms(), getBeds()]);
      setResidents(res);
      setRooms(rm);
      setBeds(b);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const getRoomName = (roomId: string) => rooms.find((r) => r.id === roomId)?.name ?? '-';
  const getBedNumber = (bedId: string) => beds.find((b) => b.id === bedId)?.bedNumber ?? '-';

  const filtered = residents.filter((r) => {
    const matchSearch =
      search === '' ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.phone.includes(search);
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchRoom = roomFilter === '' || r.roomId === roomFilter;
    return matchSearch && matchStatus && matchRoom;
  });

  const handleAdd = async (data: ResidentFormData) => {
    setSaving(true);
    try {
      await addResident({
        name: data.name,
        phone: data.phone,
        email: data.email,
        alternateContact: data.alternateContact,
        idProofNumber: data.idProofNumber,
        address: data.address,
        roomId: data.roomId,
        bedId: data.bedId,
        joinDate: new Date(data.joinDate),
        monthlyRent: data.monthlyRent,
        status: 'active',
      });
      setShowAdd(false);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (data: ResidentFormData) => {
    if (!editingResident) return;
    setSaving(true);
    try {
      await updateResident(editingResident.id, {
        name: data.name,
        phone: data.phone,
        email: data.email,
        alternateContact: data.alternateContact,
        idProofNumber: data.idProofNumber,
        address: data.address,
        joinDate: new Date(data.joinDate),
        monthlyRent: data.monthlyRent,
      });
      setEditingResident(null);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingResident) return;
    setSaving(true);
    try {
      await deleteResident(deletingResident.id, deletingResident.bedId);
      setDeletingResident(null);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleMoveOut = async () => {
    if (!moveOutResident_ || !moveOutDate) return;
    setSaving(true);
    try {
      await moveOutResident(moveOutResident_.id, new Date(moveOutDate), moveOutResident_.bedId);
      setMoveOutResident_(null);
      setMoveOutDate('');
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner className="h-64" size={32} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Residents</h1>
          <p className="text-gray-500 mt-1">Manage tenant profiles and assignments</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Resident
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name or phone..."
          className="w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="input-field w-auto"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Moved Out</option>
        </select>
        <select
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
          className="input-field w-auto"
        >
          <option value="">All Rooms</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Users size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No residents found</h3>
          <p className="text-gray-500 mb-4">
            {search || statusFilter !== 'all' || roomFilter
              ? 'Try adjusting your filters.'
              : 'Add your first resident to get started.'}
          </p>
          {!search && statusFilter === 'active' && !roomFilter && (
            <button onClick={() => setShowAdd(true)} className="btn-primary">Add Resident</button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resident</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room / Bed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Rent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-blue-700">
                            {r.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <button
                            onClick={() => setViewResident(r)}
                            className="text-sm font-medium text-gray-900 hover:text-blue-600"
                          >
                            {r.name}
                          </button>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Phone size={11} className="text-gray-400" />
                            <span className="text-xs text-gray-500">{r.phone}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{getRoomName(r.roomId)}</p>
                      <p className="text-xs text-gray-500">Bed: {getBedNumber(r.bedId)}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(r.joinDate)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCurrency(r.monthlyRent)}</td>
                    <td className="px-6 py-4">
                      <span className={r.status === 'active' ? 'badge-occupied' : 'badge-vacant'}>
                        {r.status === 'active' ? 'Active' : 'Moved Out'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {r.status === 'active' && (
                          <button
                            onClick={() => { setMoveOutResident_(r); setMoveOutDate(new Date().toISOString().split('T')[0]); }}
                            className="text-gray-400 hover:text-orange-500 transition-colors"
                            title="Move out"
                          >
                            <UserCheck size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => setEditingResident(r)}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingResident(r)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resident Details Modal */}
      <Modal isOpen={!!viewResident} onClose={() => setViewResident(null)} title="Resident Details" size="lg">
        {viewResident && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-700">{viewResident.name.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{viewResident.name}</h3>
                <span className={viewResident.status === 'active' ? 'badge-occupied' : 'badge-vacant'}>
                  {viewResident.status === 'active' ? 'Active' : 'Moved Out'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium text-gray-500">Phone:</span> <span className="text-gray-900">{viewResident.phone}</span></div>
              <div><span className="font-medium text-gray-500">Email:</span> <span className="text-gray-900">{viewResident.email || '-'}</span></div>
              <div><span className="font-medium text-gray-500">Alt. Contact:</span> <span className="text-gray-900">{viewResident.alternateContact || '-'}</span></div>
              <div><span className="font-medium text-gray-500">ID Proof:</span> <span className="text-gray-900">{viewResident.idProofNumber || '-'}</span></div>
              <div><span className="font-medium text-gray-500">Room:</span> <span className="text-gray-900">{getRoomName(viewResident.roomId)}</span></div>
              <div><span className="font-medium text-gray-500">Bed:</span> <span className="text-gray-900">{getBedNumber(viewResident.bedId)}</span></div>
              <div><span className="font-medium text-gray-500">Join Date:</span> <span className="text-gray-900">{formatDate(viewResident.joinDate)}</span></div>
              {viewResident.moveOutDate && <div><span className="font-medium text-gray-500">Move-out:</span> <span className="text-gray-900">{formatDate(viewResident.moveOutDate)}</span></div>}
              <div><span className="font-medium text-gray-500">Monthly Rent:</span> <span className="text-gray-900">{formatCurrency(viewResident.monthlyRent)}</span></div>
              <div className="col-span-2"><span className="font-medium text-gray-500">Address:</span> <span className="text-gray-900">{viewResident.address || '-'}</span></div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Resident Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add New Resident" size="xl">
        <ResidentForm
          rooms={rooms}
          beds={beds}
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
          loading={saving}
        />
      </Modal>

      {/* Edit Resident Modal */}
      <Modal isOpen={!!editingResident} onClose={() => setEditingResident(null)} title="Edit Resident" size="xl">
        {editingResident && (
          <ResidentForm
            initial={{
              name: editingResident.name,
              phone: editingResident.phone,
              email: editingResident.email,
              alternateContact: editingResident.alternateContact,
              idProofNumber: editingResident.idProofNumber,
              address: editingResident.address,
              roomId: editingResident.roomId,
              bedId: editingResident.bedId,
              joinDate: editingResident.joinDate.toISOString().split('T')[0],
              monthlyRent: editingResident.monthlyRent,
            }}
            rooms={rooms}
            beds={beds}
            onSave={handleEdit}
            onCancel={() => setEditingResident(null)}
            loading={saving}
          />
        )}
      </Modal>

      {/* Move Out Modal */}
      <Modal isOpen={!!moveOutResident_} onClose={() => setMoveOutResident_(null)} title="Confirm Move Out">
        <div className="space-y-4">
          <p className="text-gray-600">
            Confirm move-out for <strong>{moveOutResident_?.name}</strong>.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Move-out Date</label>
            <input
              type="date"
              value={moveOutDate}
              onChange={(e) => setMoveOutDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setMoveOutResident_(null)} className="btn-secondary" disabled={saving}>Cancel</button>
            <button onClick={handleMoveOut} className="btn-primary" disabled={saving || !moveOutDate}>
              {saving ? 'Processing...' : 'Confirm Move Out'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Resident Confirm */}
      <ConfirmDialog
        isOpen={!!deletingResident}
        onClose={() => setDeletingResident(null)}
        onConfirm={handleDelete}
        title="Delete Resident"
        message={`Are you sure you want to delete "${deletingResident?.name}"? This will free up their bed assignment. This action cannot be undone.`}
        loading={saving}
      />
    </div>
  );
}
