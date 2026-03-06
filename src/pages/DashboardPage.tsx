import React, { useEffect, useState } from 'react';
import {
  BedDouble,
  Users,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Home,
  UserCheck,
} from 'lucide-react';
import { getRooms } from '../services/db';
import { getBeds } from '../services/db';
import { getResidents } from '../services/db';
import { getPayments } from '../services/db';
import type { DashboardStats, Payment, Resident } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/helpers';
import { isAfter } from 'date-fns';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [recentResidents, setRecentResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [rooms, beds, residents, payments] = await Promise.all([
        getRooms(),
        getBeds(),
        getResidents(),
        getPayments(),
      ]);

      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const occupiedBeds = beds.filter((b) => b.status === 'occupied').length;
      const activeResidents = residents.filter((r) => r.status === 'active');
      const thisMonthPayments = payments.filter(
        (p) => p.paymentDate >= currentMonthStart
      );
      const paidThisMonth = thisMonthPayments.filter((p) => p.status === 'paid').length;
      const overduePayments = payments.filter(
        (p) => p.status !== 'paid' && isAfter(now, p.dueDate)
      );
      const totalRevenue = payments
        .filter((p) => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);

      setStats({
        totalRooms: rooms.length,
        totalBeds: beds.length,
        occupiedBeds,
        vacantBeds: beds.length - occupiedBeds,
        totalResidents: activeResidents.length,
        paidThisMonth,
        unpaidThisMonth: activeResidents.length - paidThisMonth,
        overdueCount: overduePayments.length,
        totalRevenue,
      });

      setRecentPayments(payments.slice(0, 5));
      setRecentResidents(
        residents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5)
      );
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner className="h-64" size={32} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your PG management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Beds"
          value={stats?.totalBeds ?? 0}
          icon={<BedDouble size={22} className="text-blue-600" />}
          color="bg-blue-50"
          subtitle={`${stats?.occupiedBeds} occupied • ${stats?.vacantBeds} vacant`}
        />
        <StatCard
          title="Active Residents"
          value={stats?.totalResidents ?? 0}
          icon={<Users size={22} className="text-purple-600" />}
          color="bg-purple-50"
        />
        <StatCard
          title="Paid This Month"
          value={stats?.paidThisMonth ?? 0}
          icon={<CheckCircle size={22} className="text-green-600" />}
          color="bg-green-50"
          subtitle={`${stats?.unpaidThisMonth} pending`}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.totalRevenue ?? 0)}
          icon={<TrendingUp size={22} className="text-orange-600" />}
          color="bg-orange-50"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Rooms"
          value={stats?.totalRooms ?? 0}
          icon={<Home size={22} className="text-indigo-600" />}
          color="bg-indigo-50"
        />
        <StatCard
          title="Occupied Beds"
          value={stats?.occupiedBeds ?? 0}
          icon={<UserCheck size={22} className="text-teal-600" />}
          color="bg-teal-50"
        />
        <StatCard
          title="Overdue Payments"
          value={stats?.overdueCount ?? 0}
          icon={<AlertCircle size={22} className="text-red-600" />}
          color="bg-red-50"
        />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Payments</h2>
          {recentPayments.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No payments recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.residentName}</p>
                    <p className="text-xs text-gray-500">{formatDate(p.paymentDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(p.amount)}</p>
                    <span className={p.status === 'paid' ? 'badge-paid' : 'badge-unpaid'}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Residents */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Residents</h2>
          {recentResidents.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No residents added yet.</p>
          ) : (
            <div className="space-y-3">
              {recentResidents.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-semibold text-blue-700">
                        {r.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.name}</p>
                      <p className="text-xs text-gray-500">Joined {formatDate(r.joinDate)}</p>
                    </div>
                  </div>
                  <span className={r.status === 'active' ? 'badge-occupied' : 'badge-vacant'}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
