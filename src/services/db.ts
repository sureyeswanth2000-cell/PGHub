import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Room, Bed, Resident, Payment, NotificationLog } from '../types';

// Helper to convert Firestore timestamps
function fromTimestamp(ts: Timestamp | Date | undefined): Date {
  if (!ts) return new Date();
  if (ts instanceof Timestamp) return ts.toDate();
  return ts;
}

// ─── ROOMS ───────────────────────────────────────────────────────────────────

export async function getRooms(): Promise<Room[]> {
  const snap = await getDocs(query(collection(db, 'rooms'), orderBy('name')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: fromTimestamp(d.data().createdAt), updatedAt: fromTimestamp(d.data().updatedAt) } as Room));
}

export async function getRoom(id: string): Promise<Room | null> {
  const snap = await getDoc(doc(db, 'rooms', id));
  if (!snap.exists()) return null;
  const d = snap.data();
  return { id: snap.id, ...d, createdAt: fromTimestamp(d.createdAt), updatedAt: fromTimestamp(d.updatedAt) } as Room;
}

export async function addRoom(data: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'rooms'), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return ref.id;
}

export async function updateRoom(id: string, data: Partial<Room>): Promise<void> {
  await updateDoc(doc(db, 'rooms', id), { ...data, updatedAt: Timestamp.now() });
}

export async function deleteRoom(id: string): Promise<void> {
  await deleteDoc(doc(db, 'rooms', id));
}

// ─── BEDS ─────────────────────────────────────────────────────────────────────

export async function getBeds(roomId?: string): Promise<Bed[]> {
  const q = roomId
    ? query(collection(db, 'beds'), where('roomId', '==', roomId), orderBy('bedNumber'))
    : query(collection(db, 'beds'), orderBy('bedNumber'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: fromTimestamp(d.data().createdAt), updatedAt: fromTimestamp(d.data().updatedAt) } as Bed));
}

export async function addBed(data: Omit<Bed, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'beds'), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return ref.id;
}

export async function updateBed(id: string, data: Partial<Bed>): Promise<void> {
  await updateDoc(doc(db, 'beds', id), { ...data, updatedAt: Timestamp.now() });
}

export async function deleteBed(id: string): Promise<void> {
  await deleteDoc(doc(db, 'beds', id));
}

export async function addBedsForRoom(roomId: string, count: number): Promise<void> {
  const existing = await getBeds(roomId);
  const batch = writeBatch(db);
  for (let i = existing.length + 1; i <= existing.length + count; i++) {
    const ref = doc(collection(db, 'beds'));
    batch.set(ref, {
      roomId,
      bedNumber: `B${i}`,
      status: 'vacant',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
  await batch.commit();
}

// ─── RESIDENTS ───────────────────────────────────────────────────────────────

export async function getResidents(filters?: { status?: string; roomId?: string }): Promise<Resident[]> {
  const constraints: Parameters<typeof query>[1][] = [orderBy('name')];
  if (filters?.status) constraints.push(where('status', '==', filters.status));
  if (filters?.roomId) constraints.push(where('roomId', '==', filters.roomId));
  const snap = await getDocs(query(collection(db, 'residents'), ...constraints));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      joinDate: fromTimestamp(data.joinDate),
      moveOutDate: data.moveOutDate ? fromTimestamp(data.moveOutDate) : undefined,
      createdAt: fromTimestamp(data.createdAt),
      updatedAt: fromTimestamp(data.updatedAt),
    } as Resident;
  });
}

export async function getResident(id: string): Promise<Resident | null> {
  const snap = await getDoc(doc(db, 'residents', id));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    ...data,
    joinDate: fromTimestamp(data.joinDate),
    moveOutDate: data.moveOutDate ? fromTimestamp(data.moveOutDate) : undefined,
    createdAt: fromTimestamp(data.createdAt),
    updatedAt: fromTimestamp(data.updatedAt),
  } as Resident;
}

export async function addResident(data: Omit<Resident, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'residents'), {
    ...data,
    joinDate: Timestamp.fromDate(data.joinDate),
    moveOutDate: data.moveOutDate ? Timestamp.fromDate(data.moveOutDate) : null,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  // Mark bed as occupied
  await updateBed(data.bedId, { status: 'occupied', residentId: ref.id });
  return ref.id;
}

export async function updateResident(id: string, data: Partial<Resident>): Promise<void> {
  const update: Record<string, unknown> = { ...data, updatedAt: Timestamp.now() };
  if (data.joinDate) update.joinDate = Timestamp.fromDate(data.joinDate);
  if (data.moveOutDate) update.moveOutDate = Timestamp.fromDate(data.moveOutDate);
  await updateDoc(doc(db, 'residents', id), update);
}

export async function moveOutResident(id: string, moveOutDate: Date, bedId: string): Promise<void> {
  await updateResident(id, { status: 'inactive', moveOutDate });
  await updateBed(bedId, { status: 'vacant', residentId: undefined });
}

export async function deleteResident(id: string, bedId: string): Promise<void> {
  await deleteDoc(doc(db, 'residents', id));
  await updateBed(bedId, { status: 'vacant', residentId: undefined });
}

// ─── PAYMENTS ────────────────────────────────────────────────────────────────

export async function getPayments(residentId?: string): Promise<Payment[]> {
  const q = residentId
    ? query(collection(db, 'payments'), where('residentId', '==', residentId), orderBy('dueDate', 'desc'))
    : query(collection(db, 'payments'), orderBy('dueDate', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      paymentDate: fromTimestamp(data.paymentDate),
      dueDate: fromTimestamp(data.dueDate),
      createdAt: fromTimestamp(data.createdAt),
      updatedAt: fromTimestamp(data.updatedAt),
    } as Payment;
  });
}

export async function addPayment(data: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'payments'), {
    ...data,
    paymentDate: Timestamp.fromDate(data.paymentDate),
    dueDate: Timestamp.fromDate(data.dueDate),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return ref.id;
}

export async function updatePayment(id: string, data: Partial<Payment>): Promise<void> {
  const update: Record<string, unknown> = { ...data, updatedAt: Timestamp.now() };
  if (data.paymentDate) update.paymentDate = Timestamp.fromDate(data.paymentDate);
  if (data.dueDate) update.dueDate = Timestamp.fromDate(data.dueDate);
  await updateDoc(doc(db, 'payments', id), update);
}

export async function deletePayment(id: string): Promise<void> {
  await deleteDoc(doc(db, 'payments', id));
}

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────

export async function getNotificationLogs(): Promise<NotificationLog[]> {
  const snap = await getDocs(query(collection(db, 'notifications'), orderBy('sentAt', 'desc')));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      sentAt: fromTimestamp(data.sentAt),
    } as NotificationLog;
  });
}

export async function addNotificationLog(data: Omit<NotificationLog, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'notifications'), {
    ...data,
    sentAt: Timestamp.fromDate(data.sentAt),
  });
  return ref.id;
}
