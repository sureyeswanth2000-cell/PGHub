import { useEffect, useState } from 'react';
import { Plus, Download, Trash2, CreditCard, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { Payment, Resident, Room, PaymentMode, PaymentType } from '../types';
import { getPayments, addPayment, updatePayment, deletePayment, getResidents, getRooms } from '../services/db';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import SearchBar from '../components/common/SearchBar';
import { formatDate, formatCurrency, isOverdue } from '../utils/helpers';
import { addMonths, format } from 'date-fns';

const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'online', label: 'Online' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
];

const PAYMENT_TYPES: { value: PaymentType; label: string }[] = [
  { value: 'monthly_rent', label: 'Monthly Rent' },
  { value: 'advance', label: 'Advance' },
  { value: 'other', label: 'Other Charges' },
];

interface PaymentFormData {
  residentId: string;
  amount: number;
  paymentDate: string;
  dueDate: string;
  paymentMode: PaymentMode;
  paymentType: PaymentType;
  status: 'paid' | 'unpaid';
  notes: string;
}

function PaymentForm({
  residents,
  rooms,
  onSave,
  onCancel,
  loading,
}: {
  residents: Resident[];
  rooms: Room[];
  onSave: (data: PaymentFormData) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const today = new Date().toISOString().split('T')[0];
  const nextMonth = format(addMonths(new Date(), 1), 'yyyy-MM-dd');
  const [form, setForm] = useState<PaymentFormData>({
    residentId: '',
    amount: 0,
    paymentDate: today,
    dueDate: nextMonth,
    paymentMode: 'cash',
    paymentType: 'monthly_rent',
    status: 'paid',
    notes: '',
  });

  const getRoomName = (roomId: string) => rooms.find((r) => r.id === roomId)?.name ?? '';

  const handleResidentChange = (id: string) => {
    const res = residents.find((r) => r.id === id);
    setForm((prev) => ({ ...prev, residentId: id, amount: res?.monthlyRent ?? prev.amount }));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Resident *</label>
        <select
          value={form.residentId}
          onChange={(e) => handleResidentChange(e.target.value)}
          className="input-field"
        >
          <option value="">Select Resident</option>
          {residents.filter((r) => r.status === 'active').map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} — {getRoomName(r.roomId)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
          <select
            value={form.paymentType}
            onChange={(e) => setForm({ ...form, paymentType: e.target.value as PaymentType })}
            className="input-field"
          >
            {PAYMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
          <input
            type="number"
            min={0}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
          <input
            type="date"
            value={form.paymentDate}
            onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
          <select
            value={form.paymentMode}
            onChange={(e) => setForm({ ...form, paymentMode: e.target.value as PaymentMode })}
            className="input-field"
          >
            {PAYMENT_MODES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as 'paid' | 'unpaid' })}
            className="input-field"
          >
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="input-field resize-none"
          rows={2}
          placeholder="Optional notes"
        />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button onClick={onCancel} className="btn-secondary" disabled={loading}>Cancel</button>
        <button
          onClick={() => { if (form.residentId && form.amount > 0) onSave(form); }}
          className="btn-primary"
          disabled={loading || !form.residentId || form.amount <= 0}
        >
          {loading ? 'Saving...' : 'Record Payment'}
        </button>
      </div>
    </div>
  );
}

function PaymentReceipt({ payment, room }: { payment: Payment; room?: Room }) {
  return (
    <div id="receipt-content" className="p-6 bg-white border border-gray-200 rounded-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">PGHub</h2>
        <p className="text-gray-500">Payment Receipt</p>
        <div className="mt-2 h-0.5 bg-gray-200" />
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm mb-6">
        <div><span className="font-medium text-gray-500">Receipt #:</span> <span className="text-gray-900">{payment.id.slice(-8).toUpperCase()}</span></div>
        <div><span className="font-medium text-gray-500">Date:</span> <span className="text-gray-900">{formatDate(payment.paymentDate)}</span></div>
        <div><span className="font-medium text-gray-500">Resident:</span> <span className="text-gray-900">{payment.residentName}</span></div>
        <div><span className="font-medium text-gray-500">Room:</span> <span className="text-gray-900">{room?.name ?? '-'}</span></div>
        <div><span className="font-medium text-gray-500">Payment Type:</span> <span className="text-gray-900">{payment.paymentType.replace(/_/g, ' ')}</span></div>
        <div><span className="font-medium text-gray-500">Mode:</span> <span className="text-gray-900">{payment.paymentMode.replace(/_/g, ' ')}</span></div>
      </div>
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-700">Amount Paid</span>
          <span className="text-2xl font-bold text-green-600">{formatCurrency(payment.amount)}</span>
        </div>
      </div>
      {payment.notes && (
        <p className="text-sm text-gray-500">Notes: {payment.notes}</p>
      )}
      <div className="mt-6 text-center text-xs text-gray-400">
        Thank you for your payment!
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all');
  const [residentFilter, setResidentFilter] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [pList, rList, rmList] = await Promise.all([getPayments(), getResidents(), getRooms()]);
      setPayments(pList);
      setResidents(rList);
      setRooms(rmList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const getResidentById = (id: string) => residents.find((r) => r.id === id);
  const getRoomById = (id: string) => rooms.find((r) => r.id === id);
  const getRoomName = (roomId: string) => rooms.find((r) => r.id === roomId)?.name ?? '-';

  const filtered = payments.filter((p) => {
    const matchSearch =
      search === '' ||
      p.residentName.toLowerCase().includes(search.toLowerCase());
    const overdue = p.status !== 'paid' && isOverdue(p.dueDate);
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'overdue' && overdue) ||
      (statusFilter !== 'overdue' && p.status === statusFilter);
    const matchResident = residentFilter === '' || p.residentId === residentFilter;
    return matchSearch && matchStatus && matchResident;
  });

  const handleAdd = async (data: PaymentFormData) => {
    setSaving(true);
    try {
      const resident = getResidentById(data.residentId);
      if (!resident) return;
      await addPayment({
        residentId: data.residentId,
        residentName: resident.name,
        roomId: resident.roomId,
        bedId: resident.bedId,
        amount: data.amount,
        paymentDate: new Date(data.paymentDate),
        dueDate: new Date(data.dueDate),
        paymentMode: data.paymentMode,
        paymentType: data.paymentType,
        status: data.status,
        notes: data.notes,
      });
      setShowAdd(false);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async (payment: Payment) => {
    try {
      await updatePayment(payment.id, { status: 'paid', paymentDate: new Date() });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!deletingPayment) return;
    setSaving(true);
    try {
      await deletePayment(deletingPayment.id);
      setDeletingPayment(null);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (payment: Payment) => {
    if (payment.status === 'paid') return <span className="badge-paid flex items-center gap-1"><CheckCircle size={10} /> Paid</span>;
    if (isOverdue(payment.dueDate)) return <span className="badge-unpaid flex items-center gap-1"><AlertCircle size={10} /> Overdue</span>;
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><XCircle size={10} /> Unpaid</span>;
  };

  // Summary stats
  const totalPaid = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalUnpaid = payments.filter((p) => p.status !== 'paid').reduce((s, p) => s + p.amount, 0);
  const overdueCount = payments.filter((p) => p.status !== 'paid' && isOverdue(p.dueDate)).length;

  if (loading) return <LoadingSpinner className="h-64" size={32} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 mt-1">Track rent and payment history</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Record Payment
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-green-500" />
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Collected</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(totalPaid)}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <XCircle size={20} className="text-yellow-500" />
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Pending</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(totalUnpaid)}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-red-500" />
            <div>
              <p className="text-xs text-gray-500 font-medium">Overdue Payments</p>
              <p className="text-lg font-bold text-gray-900">{overdueCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by resident..."
          className="w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'paid' | 'unpaid' | 'overdue')}
          className="input-field w-auto"
        >
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="overdue">Overdue</option>
        </select>
        <select
          value={residentFilter}
          onChange={(e) => setResidentFilter(e.target.value)}
          className="input-field w-auto"
        >
          <option value="">All Residents</option>
          {residents.filter((r) => r.status === 'active').map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <CreditCard size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
          <p className="text-gray-500 mb-4">
            {search || statusFilter !== 'all' || residentFilter ? 'Try adjusting your filters.' : 'Record your first payment.'}
          </p>
          {!search && statusFilter === 'all' && !residentFilter && (
            <button onClick={() => setShowAdd(true)} className="btn-primary">Record Payment</button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resident</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{p.residentName}</p>
                        <p className="text-xs text-gray-500">{getRoomName(p.roomId)}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                        {p.paymentType.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatCurrency(p.amount)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(p.paymentDate)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(p.dueDate)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 capitalize">{p.paymentMode.replace(/_/g, ' ')}</td>
                      <td className="px-6 py-4">{getStatusBadge(p)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {p.status !== 'paid' && (
                            <button
                              onClick={() => handleMarkPaid(p)}
                              className="text-gray-400 hover:text-green-600 transition-colors"
                              title="Mark as paid"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                          {p.status === 'paid' && (
                            <button
                              onClick={() => setReceiptPayment(p)}
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                              title="View receipt"
                            >
                              <Download size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => setDeletingPayment(p)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Record Payment" size="lg">
        <PaymentForm
          residents={residents}
          rooms={rooms}
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
          loading={saving}
        />
      </Modal>

      {/* Receipt Modal */}
      <Modal isOpen={!!receiptPayment} onClose={() => setReceiptPayment(null)} title="Payment Receipt" size="lg">
        {receiptPayment && (
          <div>
            <PaymentReceipt
              payment={receiptPayment}
              room={getRoomById(receiptPayment.roomId)}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setReceiptPayment(null)} className="btn-secondary">Close</button>
              <button onClick={() => window.print()} className="btn-primary flex items-center gap-2">
                <Download size={16} /> Print / Save PDF
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deletingPayment}
        onClose={() => setDeletingPayment(null)}
        onConfirm={handleDelete}
        title="Delete Payment"
        message={`Are you sure you want to delete this payment record of ${deletingPayment ? formatCurrency(deletingPayment.amount) : ''} for ${deletingPayment?.residentName}?`}
        loading={saving}
      />
    </div>
  );
}
