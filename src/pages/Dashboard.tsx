import { useMemo } from 'react';
import {
  BedDouble,
  Users,
  TrendingUp,
  AlertCircle,
  DoorOpen,
  CheckCircle,
  Clock,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { useRooms } from '../hooks/useRooms';
import { useResidents } from '../hooks/useResidents';
import { usePayments } from '../hooks/usePayments';
import { format } from '../utils/dateUtils';

export default function Dashboard() {
  const { rooms, beds } = useRooms();
  const { residents } = useResidents();
  const { payments } = usePayments();

  const stats = useMemo(() => {
    const totalBeds = beds.length;
    const occupiedBeds = beds.filter(b => b.status === 'occupied').length;
    const vacantBeds = totalBeds - occupiedBeds;
    const activeResidents = residents.filter(r => r.isActive).length;

    const currentMonth = format(new Date(), 'yyyy-MM');
    const monthlyPayments = payments.filter(
      p => p.forMonth === currentMonth && p.paymentType === 'monthly'
    );
    const totalRevenueThisMonth = monthlyPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    const residentsPaid = new Set(monthlyPayments.filter(p => p.status === 'paid').map(p => p.residentId));
    const pendingCount = activeResidents - residentsPaid.size;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newJoiners = residents.filter(
      r => r.isActive && new Date(r.joinDate) >= thirtyDaysAgo
    ).length;

    const recentLeavers = residents.filter(
      r =>
        !r.isActive &&
        r.moveOutDate &&
        new Date(r.moveOutDate) >= thirtyDaysAgo
    ).length;

    return {
      totalRooms: rooms.length,
      totalBeds,
      occupiedBeds,
      vacantBeds,
      activeResidents,
      totalRevenueThisMonth,
      pendingCount: Math.max(0, pendingCount),
      newJoiners,
      recentLeavers,
    };
  }, [rooms, beds, residents, payments]);

  const currentMonth = format(new Date(), 'yyyy-MM');
  const activeResidents = residents.filter(r => r.isActive);
  const currentMonthPayments = payments.filter(
    p => p.forMonth === currentMonth && p.paymentType === 'monthly'
  );
  const paidResidentIds = new Set(
    currentMonthPayments.filter(p => p.status === 'paid').map(p => p.residentId)
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Overview for {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Beds"
          value={stats.totalBeds}
          subtitle={`${stats.totalRooms} rooms`}
          icon={<BedDouble className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Occupied Beds"
          value={stats.occupiedBeds}
          subtitle={`${stats.vacantBeds} vacant`}
          icon={<Users className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Revenue This Month"
          value={`₹${stats.totalRevenueThisMonth.toLocaleString('en-IN')}`}
          subtitle={`${stats.pendingCount} pending`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          title="Pending Payments"
          value={stats.pendingCount}
          subtitle="for current month"
          icon={<AlertCircle className="w-5 h-5" />}
          color={stats.pendingCount > 0 ? 'red' : 'green'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Room Overview */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DoorOpen className="w-5 h-5 text-blue-500" />
            Room Overview
          </h2>
          <div className="space-y-3">
            {rooms.map(room => {
              const roomBeds = beds.filter(b => b.roomId === room.id);
              const occupied = roomBeds.filter(b => b.status === 'occupied').length;
              const total = roomBeds.length;
              const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
              return (
                <div key={room.id} className="flex items-center gap-4">
                  <div className="w-16 text-sm font-medium text-gray-700">
                    Room {room.roomNumber}
                  </div>
                  <div className="flex-1">
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-24 text-sm text-gray-500 text-right">
                    {occupied}/{total} beds
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      occupied === total
                        ? 'bg-red-100 text-red-600'
                        : occupied === 0
                        ? 'bg-green-100 text-green-600'
                        : 'bg-yellow-100 text-yellow-600'
                    }`}
                  >
                    {occupied === total ? 'Full' : occupied === 0 ? 'Empty' : 'Partial'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resident Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resident Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Active Residents</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeResidents}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">New Joiners (30d)</p>
                <p className="text-2xl font-bold text-blue-600">{stats.newJoiners}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Recent Leavers (30d)</p>
                <p className="text-2xl font-bold text-orange-600">{stats.recentLeavers}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Payment Status —{' '}
          {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Resident</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Room</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Rent</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activeResidents.map(resident => {
                const paid = paidResidentIds.has(resident.id);
                const room = rooms.find(r => r.id === resident.roomId);
                return (
                  <tr key={resident.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{resident.name}</td>
                    <td className="py-3 px-4 text-gray-600">Room {room?.roomNumber || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">
                      ₹{resident.monthlyRent.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          paid
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {paid ? (
                          <><CheckCircle className="w-3 h-3" /> Paid</>
                        ) : (
                          <><AlertCircle className="w-3 h-3" /> Unpaid</>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {activeResidents.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">
                    No active residents
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
