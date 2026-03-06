export interface Room {
  id: string;
  name: string;
  totalBeds: number;
  floor?: string;
  description?: string;
  createdAt: Date;
}

export interface Bed {
  id: string;
  roomId: string;
  bedNumber: string;
  status: 'vacant' | 'occupied';
  residentId?: string;
}

export interface Resident {
  id: string;
  name: string;
  phone: string;
  email?: string;
  alternateContact?: string;
  idProof?: string;
  address?: string;
  roomId: string;
  bedId: string;
  joinDate: Date;
  moveOutDate?: Date;
  status: 'active' | 'inactive';
  createdAt: Date;
}

export interface Payment {
  id: string;
  residentId: string;
  residentName: string;
  amount: number;
  paymentDate: Date;
  dueDate: Date;
  paymentMode: 'cash' | 'online' | 'cheque' | 'other';
  type: 'rent' | 'advance' | 'other';
  status: 'paid' | 'unpaid' | 'overdue';
  notes?: string;
  createdAt: Date;
}
