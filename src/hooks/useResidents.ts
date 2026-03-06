import { useState, useEffect } from 'react';
import type { Resident } from '../types';

const RESIDENTS_KEY = 'pghub_residents';

const sampleResidents: Resident[] = [
  {
    id: 'res1',
    name: 'Rahul Sharma',
    phone: '9876543210',
    email: 'rahul@example.com',
    alternateContact: '9876543211',
    idProofType: 'Aadhaar',
    idProofNumber: '1234-5678-9012',
    address: '123 Main St, Delhi',
    roomId: 'room1',
    bedId: 'bed1',
    joinDate: new Date('2024-06-01'),
    isActive: true,
    monthlyRent: 8000,
    advanceDeposit: 16000,
    notes: '',
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'res2',
    name: 'Priya Singh',
    phone: '9876543220',
    email: 'priya@example.com',
    idProofType: 'PAN',
    idProofNumber: 'ABCDE1234F',
    address: '456 Park Ave, Mumbai',
    roomId: 'room1',
    bedId: 'bed2',
    joinDate: new Date('2024-07-01'),
    isActive: true,
    monthlyRent: 8000,
    advanceDeposit: 8000,
    notes: '',
    createdAt: new Date('2024-07-01'),
    updatedAt: new Date('2024-07-01'),
  },
  {
    id: 'res3',
    name: 'Amit Kumar',
    phone: '9876543230',
    email: 'amit@example.com',
    idProofType: 'Passport',
    idProofNumber: 'A1234567',
    address: '789 Lake Rd, Bangalore',
    roomId: 'room2',
    bedId: 'bed4',
    joinDate: new Date('2024-05-15'),
    isActive: true,
    monthlyRent: 7500,
    advanceDeposit: 15000,
    notes: '',
    createdAt: new Date('2024-05-15'),
    updatedAt: new Date('2024-05-15'),
  },
  {
    id: 'res4',
    name: 'Sneha Patel',
    phone: '9876543240',
    email: 'sneha@example.com',
    idProofType: 'Aadhaar',
    idProofNumber: '9876-5432-1098',
    address: '101 River Lane, Pune',
    roomId: 'room3',
    bedId: 'bed6',
    joinDate: new Date('2024-08-01'),
    isActive: true,
    monthlyRent: 9000,
    advanceDeposit: 18000,
    notes: '',
    createdAt: new Date('2024-08-01'),
    updatedAt: new Date('2024-08-01'),
  },
  {
    id: 'res5',
    name: 'Vikram Rao',
    phone: '9876543250',
    email: 'vikram@example.com',
    idProofType: 'Voter ID',
    idProofNumber: 'ABC1234567',
    address: '202 Hill Top, Hyderabad',
    roomId: 'room3',
    bedId: 'bed7',
    joinDate: new Date('2024-09-01'),
    isActive: true,
    monthlyRent: 9000,
    advanceDeposit: 9000,
    notes: '',
    createdAt: new Date('2024-09-01'),
    updatedAt: new Date('2024-09-01'),
  },
  {
    id: 'res6',
    name: 'Anjali Gupta',
    phone: '9876543260',
    email: 'anjali@example.com',
    idProofType: 'Aadhaar',
    idProofNumber: '5678-1234-5678',
    address: '303 Green Park, Chennai',
    roomId: 'room3',
    bedId: 'bed8',
    joinDate: new Date('2024-10-01'),
    isActive: true,
    monthlyRent: 9000,
    advanceDeposit: 18000,
    notes: '',
    createdAt: new Date('2024-10-01'),
    updatedAt: new Date('2024-10-01'),
  },
];

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed.map((r: Resident) => ({
      ...r,
      joinDate: new Date(r.joinDate),
      moveOutDate: r.moveOutDate ? new Date(r.moveOutDate) : undefined,
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.updatedAt),
    })) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function useResidents() {
  const [residents, setResidents] = useState<Resident[]>(() =>
    loadFromStorage(RESIDENTS_KEY, sampleResidents)
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    saveToStorage(RESIDENTS_KEY, residents);
  }, [residents]);

  const addResident = (data: Omit<Resident, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    const newResident: Resident = {
      ...data,
      id: `res_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setResidents(prev => [...prev, newResident]);
    setLoading(false);
    return newResident;
  };

  const updateResident = (id: string, data: Partial<Resident>) => {
    setResidents(prev =>
      prev.map(r => (r.id === id ? { ...r, ...data, updatedAt: new Date() } : r))
    );
  };

  const removeResident = (id: string) => {
    setResidents(prev => prev.filter(r => r.id !== id));
  };

  const moveOutResident = (id: string) => {
    setResidents(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, isActive: false, moveOutDate: new Date(), updatedAt: new Date() }
          : r
      )
    );
  };

  const getResidentsByRoom = (roomId: string) =>
    residents.filter(r => r.roomId === roomId && r.isActive);

  const searchResidents = (query: string, roomId?: string, activeOnly?: boolean) => {
    return residents.filter(r => {
      const matchesSearch =
        !query ||
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.phone.includes(query) ||
        r.email?.toLowerCase().includes(query.toLowerCase());
      const matchesRoom = !roomId || r.roomId === roomId;
      const matchesActive = activeOnly === undefined || r.isActive === activeOnly;
      return matchesSearch && matchesRoom && matchesActive;
    });
  };

  return {
    residents,
    loading,
    addResident,
    updateResident,
    removeResident,
    moveOutResident,
    getResidentsByRoom,
    searchResidents,
  };
}
