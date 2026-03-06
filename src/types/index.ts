export type BedStatus = 'vacant' | 'occupied';

export type PaymentMode = 'cash' | 'online' | 'upi' | 'bank_transfer' | 'cheque';

export type PaymentType = 'monthly' | 'advance' | 'other';

export type PaymentStatus = 'paid' | 'unpaid' | 'overdue';

export interface Bed {
  id: string;
  roomId: string;
  bedNumber: string;
  status: BedStatus;
  residentId?: string;
}

export interface Room {
  id: string;
  roomNumber: string;
  floor?: string;
  totalBeds: number;
  occupiedBeds: number;
  monthlyRent: number;
  amenities?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Resident {
  id: string;
  name: string;
  phone: string;
  email?: string;
  alternateContact?: string;
  idProofType?: string;
  idProofNumber?: string;
  address?: string;
  roomId: string;
  bedId: string;
  joinDate: Date;
  moveOutDate?: Date;
  isActive: boolean;
  monthlyRent: number;
  advanceDeposit?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  residentId: string;
  residentName: string;
  roomId: string;
  roomNumber: string;
  amount: number;
  paymentDate: Date;
  paymentMode: PaymentMode;
  paymentType: PaymentType;
  forMonth?: string; // e.g. "2024-10" for October 2024
  status: PaymentStatus;
  receiptNumber?: string;
  notes?: string;
  createdAt: Date;
}

export interface DashboardStats {
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  vacantBeds: number;
  totalResidents: number;
  activeResidents: number;
  totalRevenueThisMonth: number;
  pendingPayments: number;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
