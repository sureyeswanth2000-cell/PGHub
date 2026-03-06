import { useState, useEffect } from 'react';
import type { Payment } from '../types';

const PAYMENTS_KEY = 'pghub_payments';

const samplePayments: Payment[] = [
  {
    id: 'pay1',
    residentId: 'res1',
    residentName: 'Rahul Sharma',
    roomId: 'room1',
    roomNumber: '101',
    amount: 8000,
    paymentDate: new Date('2024-10-05'),
    paymentMode: 'online',
    paymentType: 'monthly',
    forMonth: '2024-10',
    status: 'paid',
    receiptNumber: 'REC-001',
    notes: '',
    createdAt: new Date('2024-10-05'),
  },
  {
    id: 'pay2',
    residentId: 'res2',
    residentName: 'Priya Singh',
    roomId: 'room1',
    roomNumber: '101',
    amount: 8000,
    paymentDate: new Date('2024-10-03'),
    paymentMode: 'cash',
    paymentType: 'monthly',
    forMonth: '2024-10',
    status: 'paid',
    receiptNumber: 'REC-002',
    notes: '',
    createdAt: new Date('2024-10-03'),
  },
  {
    id: 'pay3',
    residentId: 'res3',
    residentName: 'Amit Kumar',
    roomId: 'room2',
    roomNumber: '102',
    amount: 7500,
    paymentDate: new Date('2024-09-30'),
    paymentMode: 'upi',
    paymentType: 'monthly',
    forMonth: '2024-10',
    status: 'paid',
    receiptNumber: 'REC-003',
    notes: '',
    createdAt: new Date('2024-09-30'),
  },
  {
    id: 'pay4',
    residentId: 'res4',
    residentName: 'Sneha Patel',
    roomId: 'room3',
    roomNumber: '201',
    amount: 18000,
    paymentDate: new Date('2024-08-01'),
    paymentMode: 'bank_transfer',
    paymentType: 'advance',
    forMonth: '2024-08',
    status: 'paid',
    receiptNumber: 'REC-004',
    notes: 'Advance deposit',
    createdAt: new Date('2024-08-01'),
  },
];

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed.map((p: Payment) => ({
      ...p,
      paymentDate: new Date(p.paymentDate),
      createdAt: new Date(p.createdAt),
    })) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

let receiptCounter = 5;

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>(() =>
    loadFromStorage(PAYMENTS_KEY, samplePayments)
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    saveToStorage(PAYMENTS_KEY, payments);
  }, [payments]);

  const addPayment = (data: Omit<Payment, 'id' | 'receiptNumber' | 'createdAt'>) => {
    setLoading(true);
    const newPayment: Payment = {
      ...data,
      id: `pay_${Date.now()}`,
      receiptNumber: `REC-${String(receiptCounter++).padStart(3, '0')}`,
      createdAt: new Date(),
    };
    setPayments(prev => [...prev, newPayment]);
    setLoading(false);
    return newPayment;
  };

  const deletePayment = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
  };

  const getPaymentsByResident = (residentId: string) =>
    payments.filter(p => p.residentId === residentId).sort(
      (a, b) => b.paymentDate.getTime() - a.paymentDate.getTime()
    );

  const getPaymentsForMonth = (month: string) =>
    payments.filter(p => p.forMonth === month);

  const hasResidentPaidForMonth = (residentId: string, month: string) =>
    payments.some(
      p =>
        p.residentId === residentId &&
        p.forMonth === month &&
        p.paymentType === 'monthly' &&
        p.status === 'paid'
    );

  return {
    payments,
    loading,
    addPayment,
    deletePayment,
    getPaymentsByResident,
    getPaymentsForMonth,
    hasResidentPaidForMonth,
  };
}
