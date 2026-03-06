import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Room } from '../../types';

const roomSchema = z.object({
  roomNumber: z.string().min(1, 'Room number is required'),
  floor: z.string().optional(),
  totalBeds: z.number().min(1, 'At least 1 bed required').max(20),
  monthlyRent: z.number().min(1, 'Rent is required'),
  amenities: z.string().optional(),
  notes: z.string().optional(),
});

type RoomFormData = z.infer<typeof roomSchema>;

interface RoomFormProps {
  room?: Room;
  onSubmit: (data: Omit<Room, 'id' | 'occupiedBeds' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export default function RoomForm({ room, onSubmit, onCancel }: RoomFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      roomNumber: room?.roomNumber || '',
      floor: room?.floor || '',
      totalBeds: room?.totalBeds || 2,
      monthlyRent: room?.monthlyRent || 7000,
      amenities: room?.amenities?.join(', ') || '',
      notes: room?.notes || '',
    },
  });

  const handleFormSubmit = (data: RoomFormData) => {
    onSubmit({
      roomNumber: data.roomNumber,
      floor: data.floor,
      totalBeds: data.totalBeds,
      monthlyRent: data.monthlyRent,
      amenities: data.amenities
        ? data.amenities.split(',').map(a => a.trim()).filter(Boolean)
        : [],
      notes: data.notes,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Room Number <span className="text-red-500">*</span>
          </label>
          <input
            {...register('roomNumber')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. 101"
          />
          {errors.roomNumber && (
            <p className="text-red-500 text-xs mt-1">{errors.roomNumber.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
          <input
            {...register('floor')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. 1st Floor"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total Beds <span className="text-red-500">*</span>
          </label>
          <Controller
            name="totalBeds"
            control={control}
            render={({ field }) => (
              <input
                type="number"
                min={1}
                max={20}
                {...field}
                onChange={e => field.onChange(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          />
          {errors.totalBeds && (
            <p className="text-red-500 text-xs mt-1">{errors.totalBeds.message}</p>
          )}
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
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amenities (comma-separated)
        </label>
        <input
          {...register('amenities')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. AC, WiFi, TV"
        />
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
          {room ? 'Update Room' : 'Add Room'}
        </button>
      </div>
    </form>
  );
}
