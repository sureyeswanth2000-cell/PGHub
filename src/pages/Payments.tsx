import { useState } from 'react';
import { Plus, Trash2, Download, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { usePayments } from '../hooks/usePayments';
import { useResidents } from '../hooks/useResidents';
import { useRooms } from '../hooks/useRooms';
import Modal from '../components/Modal';
import PaymentForm from './payments/PaymentForm';
import type { Payment } from '../types';
import { formatDisplay, getCurrentMonth, getMonthLabel } from '../utils/dateUtils';

export default function Payments() {
  const { payments, addPayment, deletePayment } = usePayments();
  const { residents } = useResidents();
  const { rooms } = useRooms();
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewReceipt, setViewReceipt] = useState<Payment | null>(null);
  const [filterResident, setFilterResident] = useState('');
  const [filterMonth, setFilterMonth] = useState(getCurrentMonth());
  const [filterType, setFilterType] = useState('');

  const activeResidents = residents.filter(r => r.isActive);

  // Generate last 12 months for filter
  const months: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const filtered = payments.filter(p => {
    const matchesResident = !filterResident || p.residentId === filterResident;
    const matchesMonth = !filterMonth || p.forMonth === filterMonth;
    const matchesType = !filterType || p.paymentType === filterType;
    return matchesResident && matchesMonth && matchesType;
  });

  const totalAmount = filtered.reduce((s, p) => s + p.amount, 0);

  const handleAddPayment = (data: Parameters<typeof addPayment>[0]) => {
    addPayment(data);
    setShowAddModal(false);
  };

  const downloadReceipt = (payment: Payment) => {
    const resident = residents.find(r => r.id === payment.residentId);
    const room = rooms.find(r => r.id === payment.roomId);
    const content = `
PAYMENT RECEIPT
================
Receipt No: ${payment.receiptNumber}
Date: ${formatDisplay(payment.paymentDate)}

Resident: ${payment.residentName}
Room: ${room?.roomNumber || '—'} | Bed: ${resident ? '' : '—'}
Phone: ${resident?.phone || '—'}

Amount: ₹${payment.amount.toLocaleString('en-IN')}
Payment Mode: ${payment.paymentMode.toUpperCase()}
Payment Type: ${payment.paymentType.toUpperCase()}
${payment.forMonth ? `For Month: ${getMonthLabel(payment.forMonth)}` : ''}
${payment.notes ? `Notes: ${payment.notes}` : ''}

Thank you for your payment!
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${payment.receiptNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 mt-1">{payments.length} total transactions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      {/* Payment Status Summary for current month */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Status for {getMonthLabel(getCurrentMonth())}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {activeResidents.map(resident => {
            const paid = payments.some(
              p =>
                p.residentId === resident.id &&
                p.forMonth === getCurrentMonth() &&
                p.paymentType === 'monthly' &&
                p.status === 'paid'
            );
            const room = rooms.find(r => r.id === resident.roomId);
            return (
              <div
                key={resident.id}
                className={`p-3 rounded-lg border ${
                  paid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {paid ? (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  )}
                  <span className="text-sm font-medium text-gray-800 truncate">{resident.name}</span>
                </div>
                <p className="text-xs text-gray-500">
                  Room {room?.roomNumber || '—'} · ₹{resident.monthlyRent.toLocaleString('en-IN')}
                </p>
                <p className={`text-xs font-medium mt-1 ${paid ? 'text-green-600' : 'text-red-600'}`}>
                  {paid ? 'Paid' : 'Pending'}
                </p>
              </div>
            );
          })}
          {activeResidents.length === 0 && (
            <p className="text-gray-400 text-sm col-span-4">No active residents.</p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 flex flex-wrap gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Search className="w-4 h-4" />
        </div>
        <select
          value={filterResident}
          onChange={e => setFilterResident(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Residents</option>
          {residents.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <select
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Months</option>
          {months.map(m => (
            <option key={m} value={m}>{getMonthLabel(m)}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          <option value="monthly">Monthly</option>
          <option value="advance">Advance</option>
          <option value="other">Other</option>
        </select>
        <div className="ml-auto text-sm font-semibold text-gray-700">
          Total: ₹{totalAmount.toLocaleString('en-IN')}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Receipt</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Resident</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Room</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Amount</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Mode</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Type</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Month</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered
                .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime())
                .map(payment => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-500 font-mono text-xs">
                      {payment.receiptNumber}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{payment.residentName}</td>
                    <td className="py-3 px-4 text-gray-600">Room {payment.roomNumber}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      ₹{payment.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{formatDisplay(payment.paymentDate)}</td>
                    <td className="py-3 px-4">
                      <span className="capitalize text-gray-600">
                        {payment.paymentMode.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          payment.paymentType === 'monthly'
                            ? 'bg-blue-100 text-blue-700'
                            : payment.paymentType === 'advance'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {payment.paymentType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">
                      {payment.forMonth ? getMonthLabel(payment.forMonth) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setViewReceipt(payment)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View Receipt"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this payment record?')) {
                              deletePayment(payment.id);
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    No payments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <Modal title="Record Payment" onClose={() => setShowAddModal(false)} size="md">
          <PaymentForm
            residents={activeResidents}
            rooms={rooms}
            onSubmit={handleAddPayment}
            onCancel={() => setShowAddModal(false)}
          />
        </Modal>
      )}

      {viewReceipt && (
        <Modal title="Payment Receipt" onClose={() => setViewReceipt(null)} size="sm">
          <div className="space-y-3 font-mono text-sm">
            <div className="text-center border-b border-gray-200 pb-3">
              <h3 className="font-bold text-lg">PGHub</h3>
              <p className="text-gray-500 text-xs">Payment Receipt</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Receipt No:</span>
                <span className="font-semibold">{viewReceipt.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date:</span>
                <span>{formatDisplay(viewReceipt.paymentDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Resident:</span>
                <span>{viewReceipt.residentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Room:</span>
                <span>{viewReceipt.roomNumber}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2">
                <span>Amount:</span>
                <span>₹{viewReceipt.amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Mode:</span>
                <span className="capitalize">{viewReceipt.paymentMode.replace('_', ' ')}</span>
              </div>
              {viewReceipt.forMonth && (
                <div className="flex justify-between">
                  <span className="text-gray-500">For Month:</span>
                  <span>{getMonthLabel(viewReceipt.forMonth)}</span>
                </div>
              )}
              {viewReceipt.notes && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Notes:</span>
                  <span>{viewReceipt.notes}</span>
                </div>
              )}
            </div>
            <div className="pt-3 flex gap-2">
              <button
                onClick={() => downloadReceipt(viewReceipt)}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={() => setViewReceipt(null)}
                className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
