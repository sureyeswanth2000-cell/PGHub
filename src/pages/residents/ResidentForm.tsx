import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Resident, Room, Bed } from '../../types';

const residentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Valid phone required').max(10),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  alternateContact: z.string().optional(),
  idProofType: z.string().optional(),
  idProofNumber: z.string().optional(),
  address: z.string().optional(),
  roomId: z.string().min(1, 'Room is required'),
  bedId: z.string().min(1, 'Bed is required'),
  joinDate: z.string().min(1, 'Join date is required'),
  isActive: z.boolean(),
  monthlyRent: z.number().min(1, 'Rent is required'),
  advanceDeposit: z.number().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof residentSchema>;

interface ResidentFormProps {
  resident?: Resident;
  rooms: Room[];
  beds: Bed[];
  onSubmit: (data: Omit<Resident, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export default function ResidentForm({ resident, rooms, beds, onSubmit, onCancel }: ResidentFormProps) {
  const [selectedRoomId, setSelectedRoomId] = useState(resident?.roomId || '');

  const availableBeds = beds.filter(
    b =>
      b.roomId === selectedRoomId &&
      (b.status === 'vacant' || b.id === resident?.bedId)
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(residentSchema),
    defaultValues: {
      name: resident?.name || '',
      phone: resident?.phone || '',
      email: resident?.email || '',
      alternateContact: resident?.alternateContact || '',
      idProofType: resident?.idProofType || '',
      idProofNumber: resident?.idProofNumber || '',
      address: resident?.address || '',
      roomId: resident?.roomId || '',
      bedId: resident?.bedId || '',
      joinDate: resident?.joinDate
        ? new Date(resident.joinDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      isActive: resident?.isActive ?? true,
      monthlyRent: resident?.monthlyRent || 7000,
      advanceDeposit: resident?.advanceDeposit,
      notes: resident?.notes || '',
    },
  });

  const handleFormSubmit = (data: FormData) => {
    onSubmit({
      name: data.name,
      phone: data.phone,
      email: data.email || undefined,
      alternateContact: data.alternateContact || undefined,
      idProofType: data.idProofType || undefined,
      idProofNumber: data.idProofNumber || undefined,
      address: data.address || undefined,
      roomId: data.roomId,
      bedId: data.bedId,
      joinDate: new Date(data.joinDate),
      isActive: data.isActive,
      monthlyRent: data.monthlyRent,
      advanceDeposit: data.advanceDeposit,
      notes: data.notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('name')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Resident name"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            {...register('phone')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="10-digit mobile number"
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            {...register('email')}
            type="email"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="email@example.com"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Contact</label>
          <input
            {...register('alternateContact')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Emergency contact number"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID Proof Type</label>
          <select
            {...register('idProofType')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select ID Type</option>
            <option value="Aadhaar">Aadhaar</option>
            <option value="PAN">PAN</option>
            <option value="Passport">Passport</option>
            <option value="Voter ID">Voter ID</option>
            <option value="Driving License">Driving License</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID Proof Number</label>
          <input
            {...register('idProofNumber')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ID number"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <textarea
          {...register('address')}
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Home/Permanent address"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Room <span className="text-red-500">*</span>
          </label>
          <select
            {...register('roomId')}
            onChange={e => {
              setSelectedRoomId(e.target.value);
              setValue('roomId', e.target.value);
              setValue('bedId', '');
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Room</option>
            {rooms.map(r => (
              <option key={r.id} value={r.id}>Room {r.roomNumber}</option>
            ))}
          </select>
          {errors.roomId && <p className="text-red-500 text-xs mt-1">{errors.roomId.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bed <span className="text-red-500">*</span>
          </label>
          <select
            {...register('bedId')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!selectedRoomId}
          >
            <option value="">Select Bed</option>
            {availableBeds.map(b => (
              <option key={b.id} value={b.id}>
                Bed {b.bedNumber} ({b.status === 'vacant' ? 'Vacant' : 'Currently assigned'})
              </option>
            ))}
          </select>
          {errors.bedId && <p className="text-red-500 text-xs mt-1">{errors.bedId.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Join Date <span className="text-red-500">*</span>
          </label>
          <input
            {...register('joinDate')}
            type="date"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.joinDate && <p className="text-red-500 text-xs mt-1">{errors.joinDate.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monthly Rent (₹) <span className="text-red-500">*</span>
          </label>
          <Controller
            name="monthlyRent"
            control={control}
            render={({ field }) => (
              <input
                type="number"
                min={1}
                {...field}
                onChange={e => field.onChange(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          />
          {errors.monthlyRent && (
            <p className="text-red-500 text-xs mt-1">{errors.monthlyRent.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Advance Deposit (₹)</label>
          <Controller
            name="advanceDeposit"
            control={control}
            render={({ field }) => (
              <input
                type="number"
                min={0}
                {...field}
                value={field.value ?? ''}
                onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          {...register('notes')}
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Any additional notes..."
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
          {resident ? 'Update Resident' : 'Add Resident'}
        </button>
      </div>
    </form>
  );
}
