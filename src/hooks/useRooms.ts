import { useState, useEffect } from 'react';
import type { Room, Bed } from '../types';

const ROOMS_KEY = 'pghub_rooms';
const BEDS_KEY = 'pghub_beds';

const sampleRooms: Room[] = [
  {
    id: 'room1',
    roomNumber: '101',
    floor: '1st Floor',
    totalBeds: 3,
    occupiedBeds: 2,
    monthlyRent: 8000,
    amenities: ['AC', 'WiFi'],
    notes: '',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'room2',
    roomNumber: '102',
    floor: '1st Floor',
    totalBeds: 2,
    occupiedBeds: 1,
    monthlyRent: 7500,
    amenities: ['WiFi'],
    notes: '',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'room3',
    roomNumber: '201',
    floor: '2nd Floor',
    totalBeds: 4,
    occupiedBeds: 3,
    monthlyRent: 9000,
    amenities: ['AC', 'WiFi', 'TV'],
    notes: 'Corner room',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

const sampleBeds: Bed[] = [
  { id: 'bed1', roomId: 'room1', bedNumber: 'A', status: 'occupied', residentId: 'res1' },
  { id: 'bed2', roomId: 'room1', bedNumber: 'B', status: 'occupied', residentId: 'res2' },
  { id: 'bed3', roomId: 'room1', bedNumber: 'C', status: 'vacant' },
  { id: 'bed4', roomId: 'room2', bedNumber: 'A', status: 'occupied', residentId: 'res3' },
  { id: 'bed5', roomId: 'room2', bedNumber: 'B', status: 'vacant' },
  { id: 'bed6', roomId: 'room3', bedNumber: 'A', status: 'occupied', residentId: 'res4' },
  { id: 'bed7', roomId: 'room3', bedNumber: 'B', status: 'occupied', residentId: 'res5' },
  { id: 'bed8', roomId: 'room3', bedNumber: 'C', status: 'occupied', residentId: 'res6' },
  { id: 'bed9', roomId: 'room3', bedNumber: 'D', status: 'vacant' },
];

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    // Convert date strings back to Date objects for Room
    if (key === ROOMS_KEY) {
      return parsed.map((r: Room) => ({
        ...r,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
      })) as T;
    }
    return parsed;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>(() => loadFromStorage(ROOMS_KEY, sampleRooms));
  const [beds, setBeds] = useState<Bed[]>(() => loadFromStorage(BEDS_KEY, sampleBeds));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    saveToStorage(ROOMS_KEY, rooms);
  }, [rooms]);

  useEffect(() => {
    saveToStorage(BEDS_KEY, beds);
  }, [beds]);

  const addRoom = (data: Omit<Room, 'id' | 'occupiedBeds' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    const newRoom: Room = {
      ...data,
      id: `room_${Date.now()}`,
      occupiedBeds: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // Create beds for the room
    const newBeds: Bed[] = Array.from({ length: data.totalBeds }, (_, i) => ({
      id: `bed_${Date.now()}_${i}`,
      roomId: newRoom.id,
      bedNumber: String.fromCharCode(65 + i), // A, B, C, ...
      status: 'vacant' as const,
    }));
    setRooms(prev => [...prev, newRoom]);
    setBeds(prev => [...prev, ...newBeds]);
    setLoading(false);
    return newRoom;
  };

  const updateRoom = (id: string, data: Partial<Room>) => {
    setRooms(prev =>
      prev.map(r => (r.id === id ? { ...r, ...data, updatedAt: new Date() } : r))
    );
  };

  const deleteRoom = (id: string) => {
    setRooms(prev => prev.filter(r => r.id !== id));
    setBeds(prev => prev.filter(b => b.roomId !== id));
  };

  const addBed = (roomId: string) => {
    const roomBeds = beds.filter(b => b.roomId === roomId);
    const bedLetter = String.fromCharCode(65 + roomBeds.length);
    const newBed: Bed = {
      id: `bed_${Date.now()}`,
      roomId,
      bedNumber: bedLetter,
      status: 'vacant',
    };
    setBeds(prev => [...prev, newBed]);
    setRooms(prev =>
      prev.map(r => (r.id === roomId ? { ...r, totalBeds: r.totalBeds + 1, updatedAt: new Date() } : r))
    );
  };

  const removeBed = (bedId: string) => {
    const bed = beds.find(b => b.id === bedId);
    if (!bed || bed.status === 'occupied') return;
    setBeds(prev => prev.filter(b => b.id !== bedId));
    setRooms(prev =>
      prev.map(r =>
        r.id === bed.roomId ? { ...r, totalBeds: r.totalBeds - 1, updatedAt: new Date() } : r
      )
    );
  };

  const updateBed = (bedId: string, data: Partial<Bed>) => {
    setBeds(prev => prev.map(b => (b.id === bedId ? { ...b, ...data } : b)));
  };

  const getBedsForRoom = (roomId: string) => beds.filter(b => b.roomId === roomId);

  return {
    rooms,
    beds,
    loading,
    addRoom,
    updateRoom,
    deleteRoom,
    addBed,
    removeBed,
    updateBed,
    getBedsForRoom,
  };
}
