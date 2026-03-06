import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, BedDouble, ChevronDown, ChevronRight } from 'lucide-react';
import type { Room, Bed } from '../types';
import { getRooms, addRoom, updateRoom, deleteRoom, getBeds, addBed, deleteBed } from '../services/db';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';

interface RoomFormData {
  name: string;
  floor: string;
  totalBeds: number;
}

function RoomForm({
  initial,
  onSave,
  onCancel,
  loading,
}: {
  initial?: Partial<RoomFormData>;
  onSave: (data: RoomFormData) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<RoomFormData>({
    name: initial?.name ?? '',
    floor: initial?.floor ?? '',
    totalBeds: initial?.totalBeds ?? 1,
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Room Name / Number *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="input-field"
          placeholder="e.g. Room 101"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
        <input
          type="text"
          value={form.floor}
          onChange={(e) => setForm({ ...form, floor: e.target.value })}
          className="input-field"
          placeholder="e.g. Ground Floor, 1st Floor"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Total Beds *</label>
        <input
          type="number"
          min={1}
          max={20}
          value={form.totalBeds}
          onChange={(e) => setForm({ ...form, totalBeds: parseInt(e.target.value) || 1 })}
          className="input-field"
        />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button onClick={onCancel} className="btn-secondary" disabled={loading}>Cancel</button>
        <button
          onClick={() => { if (form.name) onSave(form); }}
          className="btn-primary"
          disabled={loading || !form.name}
        >
          {loading ? 'Saving...' : 'Save Room'}
        </button>
      </div>
    </div>
  );
}

function BedRow({
  bed,
  onDelete,
}: {
  bed: Bed;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <BedDouble size={16} className="text-gray-400" />
        <span className="text-sm font-medium text-gray-800">{bed.bedNumber}</span>
        <span className={bed.status === 'occupied' ? 'badge-occupied' : 'badge-vacant'}>
          {bed.status}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {bed.status === 'vacant' && (
          <button
            onClick={() => onDelete(bed.id)}
            className="text-red-400 hover:text-red-600 transition-colors"
            title="Delete bed"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Record<string, Bed[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());

  const [showAddRoom, setShowAddRoom] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);
  const [savingRoom, setSavingRoom] = useState(false);
  const [deletingRoomId, setDeletingRoomId] = useState(false);

  const [addingBedToRoom, setAddingBedToRoom] = useState<string | null>(null);
  const [newBedName, setNewBedName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [roomList, allBeds] = await Promise.all([getRooms(), getBeds()]);
      setRooms(roomList);
      const bedMap: Record<string, Bed[]> = {};
      allBeds.forEach((b) => {
        if (!bedMap[b.roomId]) bedMap[b.roomId] = [];
        bedMap[b.roomId].push(b);
      });
      setBeds(bedMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const toggleExpand = (roomId: string) => {
    setExpandedRooms((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) next.delete(roomId);
      else next.add(roomId);
      return next;
    });
  };

  const handleAddRoom = async (data: RoomFormData) => {
    setSavingRoom(true);
    try {
      const roomId = await addRoom({ name: data.name, floor: data.floor, totalBeds: data.totalBeds });
      // Add beds automatically
      for (let i = 1; i <= data.totalBeds; i++) {
        await addBed({ roomId, bedNumber: `B${i}`, status: 'vacant' });
      }
      setShowAddRoom(false);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingRoom(false);
    }
  };

  const handleEditRoom = async (data: RoomFormData) => {
    if (!editingRoom) return;
    setSavingRoom(true);
    try {
      await updateRoom(editingRoom.id, { name: data.name, floor: data.floor, totalBeds: data.totalBeds });
      setEditingRoom(null);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingRoom(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!deletingRoom) return;
    setDeletingRoomId(true);
    try {
      // Delete all beds first
      const roomBeds = beds[deletingRoom.id] ?? [];
      await Promise.all(roomBeds.map((b) => deleteBed(b.id)));
      await deleteRoom(deletingRoom.id);
      setDeletingRoom(null);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingRoomId(false);
    }
  };

  const handleAddBed = async (roomId: string) => {
    if (!newBedName.trim()) return;
    try {
      await addBed({ roomId, bedNumber: newBedName.trim(), status: 'vacant' });
      setAddingBedToRoom(null);
      setNewBedName('');
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBed = async (bedId: string) => {
    try {
      await deleteBed(bedId);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <LoadingSpinner className="h-64" size={32} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rooms & Beds</h1>
          <p className="text-gray-500 mt-1">Manage rooms and bed assignments</p>
        </div>
        <button onClick={() => setShowAddRoom(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Room
        </button>
      </div>

      {rooms.length === 0 ? (
        <div className="card text-center py-12">
          <BedDouble size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms yet</h3>
          <p className="text-gray-500 mb-4">Add your first room to get started.</p>
          <button onClick={() => setShowAddRoom(true)} className="btn-primary">Add Room</button>
        </div>
      ) : (
        <div className="space-y-4">
          {rooms.map((room) => {
            const roomBeds = beds[room.id] ?? [];
            const occupied = roomBeds.filter((b) => b.status === 'occupied').length;
            const vacant = roomBeds.filter((b) => b.status === 'vacant').length;
            const isExpanded = expandedRooms.has(room.id);

            return (
              <div key={room.id} className="card">
                {/* Room Header */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleExpand(room.id)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown size={18} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={18} className="text-gray-400" />
                    )}
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{room.name}</h3>
                      {room.floor && (
                        <span className="text-xs text-gray-500">{room.floor}</span>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <span className="badge-occupied">{occupied} occupied</span>
                      <span className="badge-vacant">{vacant} vacant</span>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingRoom(room)}
                      className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                      title="Edit room"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeletingRoom(room)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                      title="Delete room"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Beds */}
                {isExpanded && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">Beds ({roomBeds.length})</h4>
                      <button
                        onClick={() => { setAddingBedToRoom(room.id); setNewBedName(''); }}
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Bed
                      </button>
                    </div>

                    {addingBedToRoom === room.id && (
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          value={newBedName}
                          onChange={(e) => setNewBedName(e.target.value)}
                          className="input-field text-sm"
                          placeholder="Bed number, e.g. B3"
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAddBed(room.id); }}
                          autoFocus
                        />
                        <button onClick={() => handleAddBed(room.id)} className="btn-primary text-sm px-3">Add</button>
                        <button onClick={() => setAddingBedToRoom(null)} className="btn-secondary text-sm px-3">Cancel</button>
                      </div>
                    )}

                    {roomBeds.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No beds in this room.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {roomBeds.map((bed) => (
                          <BedRow
                            key={bed.id}
                            bed={bed}
                            onDelete={handleDeleteBed}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Room Modal */}
      <Modal isOpen={showAddRoom} onClose={() => setShowAddRoom(false)} title="Add New Room">
        <RoomForm
          onSave={handleAddRoom}
          onCancel={() => setShowAddRoom(false)}
          loading={savingRoom}
        />
      </Modal>

      {/* Edit Room Modal */}
      <Modal isOpen={!!editingRoom} onClose={() => setEditingRoom(null)} title="Edit Room">
        {editingRoom && (
          <RoomForm
            initial={editingRoom}
            onSave={handleEditRoom}
            onCancel={() => setEditingRoom(null)}
            loading={savingRoom}
          />
        )}
      </Modal>

      {/* Delete Room Confirm */}
      <ConfirmDialog
        isOpen={!!deletingRoom}
        onClose={() => setDeletingRoom(null)}
        onConfirm={handleDeleteRoom}
        title="Delete Room"
        message={`Are you sure you want to delete "${deletingRoom?.name}"? All beds in this room will also be deleted. This action cannot be undone.`}
        loading={deletingRoomId}
      />
    </div>
  );
}
