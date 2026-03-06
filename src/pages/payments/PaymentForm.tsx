import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Resident, Room, Payment } from '../../types';
import { getCurrentMonth } from '../../utils/dateUtils';

const paymentSchema = z.object({
  residentId: z.string().min(1, 'Resident is required'),
  amount: z.number().min(1, 'Amount is required'),
  paymentDate: z.string().min(1, 'Date is required'),
  paymentMode: z.enum(['cash', 'online', 'upi', 'bank_transfer', 'cheque']),
  paymentType: z.enum(['monthly', 'advance', 'other']),
  forMonth: z.string().optional(),
  status: z.enum(['paid', 'unpaid', 'overdue']),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  residents: Resident[];
  rooms: Room[];
  onSubmit: (data: Omit<Payment, 'id' | 'receiptNumber' | 'createdAt'>) => void;
  onCancel: () => void;
}

export default function PaymentForm({ residents, rooms, onSubmit, onCancel }: PaymentFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      residentId: '',
      amount: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: 'cash',
      paymentType: 'monthly',
      forMonth: getCurrentMonth(),
      status: 'paid',
      notes: '',
    },
  });

  const selectedResidentId = watch('residentId');
  const selectedResident = residents.find(r => r.id === selectedResidentId);

  const handleFormSubmit = (data: FormData) => {
    const resident = residents.find(r => r.id === data.residentId);
    const room = rooms.find(r => r.id === resident?.roomId);
    onSubmit({
      residentId: data.residentId,
      residentName: resident?.name || '',
      roomId: resident?.roomId || '',
      roomNumber: room?.roomNumber || '',
      amount: data.amount,
      paymentDate: new Date(data.paymentDate),
      paymentMode: data.paymentMode,
      paymentType: data.paymentType,
      forMonth: data.forMonth || undefined,
      status: data.status,
      notes: data.notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Resident <span className="text-red-500">*</span>
        </label>
        <select
          {...register('residentId')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Resident</option>
          {residents.map(r => {
            const room = rooms.find(rm => rm.id === r.roomId);
            return (
              <option key={r.id} value={r.id}>
                {r.name} — Room {room?.roomNumber || '?'}
              </option>
            );
          })}
        </select>
        {errors.residentId && (
          <p className="text-red-500 text-xs mt-1">{errors.residentId.message}</p>
        )}
        {selectedResident && (
          <p className="text-xs text-blue-600 mt-1">
            Monthly rent: ₹{selectedResident.monthlyRent.toLocaleString('en-IN')}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (₹) <span className="text-red-500">*</span>
          </label>
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <input
                type="number"
                min={1}
                {...field}
                value={field.value || ''}
                onChange={e => field.onChange(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          />
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Date <span className="text-red-500">*</span>
          </label>
          <input
            {...register('paymentDate')}
            type="date"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.paymentDate && (
            <p className="text-red-500 text-xs mt-1">{errors.paymentDate.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
          <select
            {...register('paymentMode')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="cash">Cash</option>
            <option value="online">Online</option>
            <option value="upi">UPI</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
          <select
            {...register('paymentType')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="monthly">Monthly Rent</option>
            <option value="advance">Advance</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">For Month</label>
          <input
            {...register('forMonth')}
            type="month"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            {...register('status')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          {...register('notes')}
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Optional notes..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Record Payment
        </button>
      </div>
    </form>
  );
}
