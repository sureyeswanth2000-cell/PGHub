import { useState } from 'react';
import { Plus, Edit2, Trash2, BedDouble, ChevronDown, ChevronUp } from 'lucide-react';
import { useRooms } from '../hooks/useRooms';
import { useResidents } from '../hooks/useResidents';
import Modal from '../components/Modal';
import RoomForm from './rooms/RoomForm';
import type { Room } from '../types';

export default function Rooms() {
  const { rooms, beds, addRoom, updateRoom, deleteRoom, addBed, removeBed } = useRooms();
  const { residents } = useResidents();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);

  const handleAddRoom = (data: Parameters<typeof addRoom>[0]) => {
    addRoom(data);
    setShowAddModal(false);
  };

  const handleUpdateRoom = (data: Parameters<typeof addRoom>[0]) => {
    if (!editRoom) return;
    updateRoom(editRoom.id, data);
    setEditRoom(null);
  };

  const handleDeleteRoom = (room: Room) => {
    const roomBeds = beds.filter(b => b.roomId === room.id);
    const hasOccupied = roomBeds.some(b => b.status === 'occupied');
    if (hasOccupied) {
      alert('Cannot delete a room with occupied beds. Please move out residents first.');
      return;
    }
    if (window.confirm(`Delete Room ${room.roomNumber}? This cannot be undone.`)) {
      deleteRoom(room.id);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rooms & Beds</h1>
          <p className="text-gray-500 mt-1">{rooms.length} rooms, {beds.length} total beds</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Room
        </button>
      </div>

      <div className="space-y-4">
        {rooms.map(room => {
          const roomBeds = beds.filter(b => b.roomId === room.id);
          const occupied = roomBeds.filter(b => b.status === 'occupied').length;
          const isExpanded = expandedRoom === room.id;

          return (
            <div key={room.id} className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                      <BedDouble className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Room {room.roomNumber}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {room.floor && `${room.floor} · `}
                        ₹{room.monthlyRent.toLocaleString('en-IN')}/month
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex gap-2 mb-1">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          {roomBeds.length - occupied} vacant
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          {occupied} occupied
                        </span>
                      </div>
                      {room.amenities && room.amenities.length > 0 && (
                        <div className="flex gap-1 justify-end flex-wrap">
                          {room.amenities.map(a => (
                            <span key={a} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditRoom(room)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setExpandedRoom(isExpanded ? null : room.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-700">Beds</h4>
                    <button
                      onClick={() => addBed(room.id)}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Bed
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {roomBeds.map(bed => {
                      const resident = bed.residentId
                        ? residents.find(r => r.id === bed.residentId)
                        : null;
                      return (
                        <div
                          key={bed.id}
                          className={`p-3 rounded-lg border-2 ${
                            bed.status === 'occupied'
                              ? 'border-blue-200 bg-blue-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-gray-700">
                              Bed {bed.bedNumber}
                            </span>
                            {bed.status === 'vacant' && (
                              <button
                                onClick={() => removeBed(bed.id)}
                                className="text-red-400 hover:text-red-600"
                                title="Remove bed"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              bed.status === 'occupied'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {bed.status === 'occupied' ? 'Occupied' : 'Vacant'}
                          </span>
                          {resident && (
                            <p className="text-xs text-gray-600 mt-1 truncate">{resident.name}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {roomBeds.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">
                      No beds configured. Add beds to this room.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {rooms.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <BedDouble className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No rooms added yet. Add your first room.</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <Modal title="Add Room" onClose={() => setShowAddModal(false)} size="lg">
          <RoomForm onSubmit={handleAddRoom} onCancel={() => setShowAddModal(false)} />
        </Modal>
      )}

      {editRoom && (
        <Modal title="Edit Room" onClose={() => setEditRoom(null)} size="lg">
          <RoomForm
            room={editRoom}
            onSubmit={handleUpdateRoom}
            onCancel={() => setEditRoom(null)}
          />
        </Modal>
      )}
    </div>
  );
}
