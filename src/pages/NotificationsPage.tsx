import { useEffect, useState } from 'react';
import { Bell, Send, MessageCircle, Phone, Clock } from 'lucide-react';
import type { Resident, Room, Bed, NotificationLog } from '../types';
import { getResidents, getRooms, getBeds, addNotificationLog, getNotificationLogs } from '../services/db';
import { getPayments as fetchPayments } from '../services/db';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import {
  generatePaymentMessage,
  generateWelcomeMessage,
  generateMoveOutMessage,
  formatDateTime,
  isOverdue,
} from '../utils/helpers';
import type { Payment } from '../types';

type MessageType = 'payment_reminder' | 'welcome' | 'move_out' | 'custom';

export default function NotificationsPage() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCompose, setShowCompose] = useState(false);
  const [selectedResident, setSelectedResident] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('payment_reminder');
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [res, rm, b, pay, notifLogs] = await Promise.all([
        getResidents({ status: 'active' }),
        getRooms(),
        getBeds(),
        fetchPayments(),
        getNotificationLogs(),
      ]);
      setResidents(res);
      setRooms(rm);
      setBeds(b);
      setPayments(pay);
      setLogs(notifLogs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const getRoomName = (roomId: string) => rooms.find((r) => r.id === roomId)?.name ?? '-';
  const getBedNumber = (bedId: string) => beds.find((b) => b.id === bedId)?.bedNumber ?? '-';

  const getGeneratedMessage = (residentId: string, type: MessageType) => {
    const resident = residents.find((r) => r.id === residentId);
    if (!resident) return '';
    const room = rooms.find((r) => r.id === resident.roomId);
    const bed = beds.find((b) => b.id === resident.bedId);

    switch (type) {
      case 'payment_reminder': {
        const overduePayments = payments.filter(
          (p) => p.residentId === residentId && p.status !== 'paid'
        );
        const dueDate = overduePayments[0]?.dueDate ?? new Date();
        const amount = overduePayments[0]?.amount ?? resident.monthlyRent;
        return generatePaymentMessage(resident.name, amount, dueDate);
      }
      case 'welcome':
        return generateWelcomeMessage(
          resident.name,
          room?.name ?? '',
          bed?.bedNumber ?? ''
        );
      case 'move_out':
        return generateMoveOutMessage(resident.name, resident.moveOutDate ?? new Date());
      case 'custom':
        return customMessage;
      default:
        return '';
    }
  };

  const computedMessage =
    messageType === 'custom'
      ? customMessage
      : selectedResident
      ? getGeneratedMessage(selectedResident, messageType)
      : '';

  const overdueResidents = residents.filter((r) =>
    payments.some((p) => p.residentId === r.id && p.status !== 'paid' && isOverdue(p.dueDate))
  );

  const handleSend = async (type: 'whatsapp' | 'sms') => {
    const resident = residents.find((r) => r.id === selectedResident);
    if (!resident || !computedMessage) return;

    setSending(true);
    try {
      // Open WhatsApp / SMS link
      const phone = resident.phone.replace(/\D/g, '');
      if (type === 'whatsapp') {
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(computedMessage)}`;
        window.open(url, '_blank');
      } else {
        const url = `sms:${resident.phone}?body=${encodeURIComponent(computedMessage)}`;
        window.open(url);
      }

      await addNotificationLog({
        residentId: selectedResident,
        residentName: resident.name,
        type,
        messageType,
        message: computedMessage,
        sentAt: new Date(),
        status: 'sent',
      });

      setShowCompose(false);
      setSelectedResident('');
      setCustomMessage('');
      setMessageType('payment_reminder');
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const sendBulkReminders = async () => {
    for (const resident of overdueResidents) {
      const overduePayments = payments.filter(
        (p) => p.residentId === resident.id && p.status !== 'paid' && isOverdue(p.dueDate)
      );
      if (overduePayments.length === 0) continue;
      const message = generatePaymentMessage(
        resident.name,
        overduePayments[0].amount,
        overduePayments[0].dueDate
      );
      const phone = resident.phone.replace(/\D/g, '');
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
      await addNotificationLog({
        residentId: resident.id,
        residentName: resident.name,
        type: 'whatsapp',
        messageType: 'payment_reminder',
        message,
        sentAt: new Date(),
        status: 'sent',
      });
    }
    await loadData();
  };

  if (loading) return <LoadingSpinner className="h-64" size={32} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">Send WhatsApp and SMS messages to residents</p>
        </div>
        <button onClick={() => setShowCompose(true)} className="btn-primary flex items-center gap-2">
          <Send size={16} /> Compose Message
        </button>
      </div>

      {/* Overdue Alert */}
      {overdueResidents.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-red-800 flex items-center gap-2">
                <Bell size={16} /> {overdueResidents.length} residents have overdue payments
              </h3>
              <p className="text-sm text-red-600 mt-1">
                {overdueResidents.map((r) => r.name).join(', ')}
              </p>
            </div>
            <button
              onClick={sendBulkReminders}
              className="btn-danger text-sm flex items-center gap-2"
            >
              <MessageCircle size={14} /> Send All Reminders
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {residents.map((resident) => {
          const hasOverdue = payments.some(
            (p) => p.residentId === resident.id && p.status !== 'paid' && isOverdue(p.dueDate)
          );
          return (
            <div key={resident.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-700">
                      {resident.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{resident.name}</p>
                    <p className="text-xs text-gray-500">{getRoomName(resident.roomId)} · Bed {getBedNumber(resident.bedId)}</p>
                    {hasOverdue && (
                      <span className="badge-unpaid text-xs mt-1">Overdue</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`https://wa.me/${resident.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                      generatePaymentMessage(resident.name, resident.monthlyRent, new Date())
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="WhatsApp"
                  >
                    <MessageCircle size={16} />
                  </a>
                  <a
                    href={`tel:${resident.phone}`}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Call"
                  >
                    <Phone size={16} />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
        {residents.length === 0 && (
          <div className="col-span-2 card text-center py-8">
            <Bell size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No active residents to notify.</p>
          </div>
        )}
      </div>

      {/* Notification History */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock size={16} /> Notification History
        </h2>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">No notifications sent yet.</p>
        ) : (
          <div className="space-y-3">
            {logs.slice(0, 20).map((log) => (
              <div key={log.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    {log.type === 'whatsapp' ? (
                      <MessageCircle size={14} className="text-green-600" />
                    ) : (
                      <Phone size={14} className="text-blue-600" />
                    )}
                    <span className="text-sm font-medium text-gray-900">{log.residentName}</span>
                    <span className="text-xs text-gray-500 capitalize">
                      ({log.messageType.replace(/_/g, ' ')})
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">{log.message}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-xs text-gray-400">{formatDateTime(log.sentAt)}</p>
                  <span className={`text-xs font-medium ${log.status === 'sent' ? 'text-green-600' : 'text-red-600'}`}>
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compose Modal */}
      <Modal isOpen={showCompose} onClose={() => setShowCompose(false)} title="Compose Message" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resident *</label>
            <select
              value={selectedResident}
              onChange={(e) => setSelectedResident(e.target.value)}
              className="input-field"
            >
              <option value="">Select Resident</option>
              {residents.map((r) => (
                <option key={r.id} value={r.id}>{r.name} — {getRoomName(r.roomId)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'payment_reminder', label: '💰 Payment Reminder' },
                { value: 'welcome', label: '👋 Welcome Message' },
                { value: 'move_out', label: '🏠 Move-out Farewell' },
                { value: 'custom', label: '✍️ Custom Message' },
              ].map((t) => (
                <label
                  key={t.value}
                  className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer text-sm transition-colors ${
                    messageType === t.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="messageType"
                    value={t.value}
                    checked={messageType === t.value}
                    onChange={() => setMessageType(t.value as MessageType)}
                    className="hidden"
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message Preview</label>
            <textarea
              value={messageType === 'custom' ? customMessage : computedMessage}
              onChange={(e) => {
                if (messageType === 'custom') setCustomMessage(e.target.value);
              }}
              className="input-field resize-none"
              rows={5}
              readOnly={messageType !== 'custom'}
              placeholder={messageType === 'custom' ? 'Type your custom message here...' : 'Select a resident to preview the message'}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowCompose(false)} className="btn-secondary" disabled={sending}>Cancel</button>
            <button
              onClick={() => handleSend('sms')}
              disabled={sending || !selectedResident || !computedMessage}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              <Phone size={14} /> Send SMS
            </button>
            <button
              onClick={() => handleSend('whatsapp')}
              disabled={sending || !selectedResident || !computedMessage}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              <MessageCircle size={14} /> Send WhatsApp
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
