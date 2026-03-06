export interface Room {
  id: string;
  name: string;
  floor?: string;
  totalBeds: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Bed {
  id: string;
  roomId: string;
  bedNumber: string;
  status: 'vacant' | 'occupied';
  residentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Resident {
  id: string;
  name: string;
  phone: string;
  email?: string;
  alternateContact?: string;
  idProofNumber?: string;
  address?: string;
  roomId: string;
  bedId: string;
  joinDate: Date;
  moveOutDate?: Date;
  status: 'active' | 'inactive';
  monthlyRent: number;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentMode = 'cash' | 'online' | 'upi' | 'bank_transfer' | 'cheque';
export type PaymentType = 'monthly_rent' | 'advance' | 'other';
export type PaymentStatus = 'paid' | 'unpaid' | 'overdue';

export interface Payment {
  id: string;
  residentId: string;
  residentName: string;
  roomId: string;
  bedId: string;
  amount: number;
  paymentDate: Date;
  dueDate: Date;
  paymentMode: PaymentMode;
  paymentType: PaymentType;
  status: PaymentStatus;
  month?: string;
  year?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationLog {
  id: string;
  residentId: string;
  residentName: string;
  type: 'whatsapp' | 'sms';
  messageType: 'payment_reminder' | 'welcome' | 'move_out' | 'custom';
  message: string;
  sentAt: Date;
  status: 'sent' | 'failed' | 'pending';
}

export interface DashboardStats {
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  vacantBeds: number;
  totalResidents: number;
  paidThisMonth: number;
  unpaidThisMonth: number;
  overdueCount: number;
  totalRevenue: number;
}
