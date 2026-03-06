import { useState } from 'react';
import { Plus, Edit2, Trash2, Search, Phone, MessageCircle, UserX } from 'lucide-react';
import { useResidents } from '../hooks/useResidents';
import { useRooms } from '../hooks/useRooms';
import Modal from '../components/Modal';
import ResidentForm from './residents/ResidentForm';
import type { Resident } from '../types';
import { formatDisplay } from '../utils/dateUtils';

export default function Residents() {
  const { residents, addResident, updateResident, removeResident, moveOutResident } = useResidents();
  const { rooms, beds, updateBed } = useRooms();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editResident, setEditResident] = useState<Resident | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('active');

  const filtered = residents.filter(r => {
    const matchesSearch =
      !searchQuery ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery);
    const matchesRoom = !filterRoom || r.roomId === filterRoom;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' ? r.isActive : !r.isActive);
    return matchesSearch && matchesRoom && matchesStatus;
  });

  const handleAddResident = (data: Omit<Resident, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newResident = addResident(data);
    // Mark bed as occupied
    updateBed(data.bedId, { status: 'occupied', residentId: newResident.id });
    setShowAddModal(false);
  };

  const handleUpdateResident = (data: Omit<Resident, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editResident) return;
    // If bed changed, update old and new bed
    if (editResident.bedId !== data.bedId) {
      updateBed(editResident.bedId, { status: 'vacant', residentId: undefined });
      updateBed(data.bedId, { status: 'occupied', residentId: editResident.id });
    }
    updateResident(editResident.id, data);
    setEditResident(null);
  };

  const handleMoveOut = (resident: Resident) => {
    if (window.confirm(`Mark ${resident.name} as moved out?`)) {
      moveOutResident(resident.id);
      updateBed(resident.bedId, { status: 'vacant', residentId: undefined });
    }
  };

  const handleDelete = (resident: Resident) => {
    if (window.confirm(`Permanently delete ${resident.name}'s record?`)) {
      removeResident(resident.id);
      if (resident.isActive) {
        updateBed(resident.bedId, { status: 'vacant', residentId: undefined });
      }
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Residents</h1>
          <p className="text-gray-500 mt-1">
            {residents.filter(r => r.isActive).length} active residents
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Resident
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterRoom}
          onChange={e => setFilterRoom(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Rooms</option>
          {rooms.map(r => (
            <option key={r.id} value={r.id}>Room {r.roomNumber}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="active">Active</option>
          <option value="inactive">Moved Out</option>
          <option value="all">All</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Name</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Room / Bed</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Phone</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Join Date</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Rent</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(resident => {
                const room = rooms.find(r => r.id === resident.roomId);
                const bed = beds.find(b => b.id === resident.bedId);
                return (
                  <tr key={resident.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{resident.name}</div>
                      {resident.email && (
                        <div className="text-xs text-gray-400">{resident.email}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      Room {room?.roomNumber || '—'} / Bed {bed?.bedNumber || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">{resident.phone}</span>
                        <a
                          href={`https://wa.me/91${resident.phone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-500 hover:text-green-600"
                          title="WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{formatDisplay(resident.joinDate)}</td>
                    <td className="py-3 px-4 text-gray-600">
                      ₹{resident.monthlyRent.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          resident.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {resident.isActive ? 'Active' : 'Moved Out'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditResident(resident)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {resident.isActive && (
                          <button
                            onClick={() => handleMoveOut(resident)}
                            className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                            title="Move Out"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <a
                          href={`tel:${resident.phone}`}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Call"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleDelete(resident)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    No residents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <Modal title="Add Resident" onClose={() => setShowAddModal(false)} size="lg">
          <ResidentForm
            rooms={rooms}
            beds={beds}
            onSubmit={handleAddResident}
            onCancel={() => setShowAddModal(false)}
          />
        </Modal>
      )}

      {editResident && (
        <Modal title="Edit Resident" onClose={() => setEditResident(null)} size="lg">
          <ResidentForm
            resident={editResident}
            rooms={rooms}
            beds={beds}
            onSubmit={handleUpdateResident}
            onCancel={() => setEditResident(null)}
          />
        </Modal>
      )}
    </div>
  );
}
