import { useEffect, useState } from 'react';
import { db } from '../db/db';
import { formatCurrency, getTodayDateString } from '../utils/formatters';
import { Users, Clock } from 'lucide-react';
import type { NavigationTab } from '../App';

interface DashboardProps {
  onNavigate: (tab: NavigationTab) => void;
  onOpenStaff: (staffId: string) => void;
}

export default function DashboardView({ onNavigate }: DashboardProps) {
  const today = getTodayDateString();
  const currentMonth = today.slice(0, 7); // YYYY-MM

  const [activeStaffCount, setActiveStaffCount] = useState(0);
  const [todaySummary, setTodaySummary] = useState({ full: 0, half: 0, leave: 0, totalWages: 0, paid: 0, unpaid: 0 });
  const [monthSummary, setMonthSummary] = useState({ totalWages: 0, paid: 0, unpaid: 0, advances: 0 });

  useEffect(() => {
    loadDashboardMetrics();
  }, []);

  const loadDashboardMetrics = async () => {
    // Active staff
    const staff = await db.staff.where('active').equals(1).toArray();
    setActiveStaffCount(staff.length);

    // Today's records
    const todayRecords = await db.attendance.where('date').equals(today).toArray();
    let full = 0, half = 0, leave = 0, tWages = 0, tPaid = 0, tUnpaid = 0;

    todayRecords.forEach(r => {
      if (r.status === 'full') full++;
      if (r.status === 'half') half++;
      if (r.status === 'leave') leave++;
      tWages += r.calculated_wage;
      if (r.payment_status === 'paid') tPaid += r.calculated_wage;
      else tUnpaid += r.calculated_wage;
    });

    setTodaySummary({ full, half, leave, totalWages: tWages, paid: tPaid, unpaid: tUnpaid });

    // Current Month Attendance
    const allRecords = await db.attendance.toArray();
    const monthRecords = allRecords.filter(r => r.date.startsWith(currentMonth));
    let mWages = 0, mPaid = 0, mUnpaid = 0;

    monthRecords.forEach(r => {
      mWages += r.calculated_wage;
      if (r.payment_status === 'paid') mPaid += r.calculated_wage;
      else mUnpaid += r.calculated_wage;
    });

    // Current Month Advances
    const allAdvances = await db.advances.toArray();
    const mAdvances = allAdvances
      .filter(a => a.date.startsWith(currentMonth))
      .reduce((sum, a) => sum + a.amount, 0);

    setMonthSummary({ totalWages: mWages, paid: mPaid, unpaid: mUnpaid, advances: mAdvances });
  };

  const formattedDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Owner Dashboard</h1>
          <p className="text-xs font-medium text-slate-500">{formattedDate}</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-xs font-semibold text-indigo-700">{activeStaffCount} Active Staff</span>
        </div>
      </div>

      {/* Today's Section */}
      <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Today's Summary</h2>
          <button
            onClick={() => onNavigate('attendance')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Mark Attendance →
          </button>
        </div>

        {/* Counts */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg py-2">
            <div className="text-lg font-bold text-emerald-700">{todaySummary.full}</div>
            <div className="text-[11px] font-medium text-emerald-800">Full Day</div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-lg py-2">
            <div className="text-lg font-bold text-amber-700">{todaySummary.half}</div>
            <div className="text-[11px] font-medium text-amber-800">Half Day</div>
          </div>
          <div className="bg-rose-50 border border-rose-100 rounded-lg py-2">
            <div className="text-lg font-bold text-rose-700">{todaySummary.leave}</div>
            <div className="text-[11px] font-medium text-rose-800">Leave</div>
          </div>
        </div>

        {/* Today's Financials */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">Wages</span>
            <span className="font-bold text-slate-800">{formatCurrency(todaySummary.totalWages)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Paid</span>
            <span className="font-bold text-emerald-600">{formatCurrency(todaySummary.paid)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Unpaid</span>
            <span className="font-bold text-rose-600">{formatCurrency(todaySummary.unpaid)}</span>
          </div>
        </div>
      </div>

      {/* Month's Overview Section */}
      <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">This Month's Payroll</h2>

        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex justify-between items-center">
          <div>
            <span className="text-xs text-slate-500 block">Total Wages Earned</span>
            <span className="text-xl font-bold text-slate-900">{formatCurrency(monthSummary.totalWages)}</span>
          </div>
          <button
            onClick={() => onNavigate('payroll')}
            className="text-xs bg-indigo-600 text-white font-medium px-3 py-1.5 rounded-lg shadow-xs"
          >
            View Payroll
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
          <div className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
            <span className="text-emerald-700 block text-[10px]">Paid</span>
            <span className="font-bold text-emerald-800 text-sm">{formatCurrency(monthSummary.paid)}</span>
          </div>
          <div className="bg-rose-50/60 p-2 rounded-lg border border-rose-100">
            <span className="text-rose-700 block text-[10px]">Unpaid</span>
            <span className="font-bold text-rose-800 text-sm">{formatCurrency(monthSummary.unpaid)}</span>
          </div>
          <div className="bg-indigo-50/60 p-2 rounded-lg border border-indigo-100">
            <span className="text-indigo-700 block text-[10px]">Advance</span>
            <span className="font-bold text-indigo-800 text-sm">{formatCurrency(monthSummary.advances)}</span>
          </div>
        </div>
      </div>

      {/* Fast Action Shortcuts */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          onClick={() => onNavigate('attendance')}
          className="flex items-center justify-center gap-2 p-3 bg-white border border-slate-200 rounded-xl font-semibold text-xs text-slate-700 shadow-xs hover:bg-slate-50"
        >
          <Clock className="w-4 h-4 text-indigo-500" /> Mark Today
        </button>
        <button
          onClick={() => onNavigate('staff')}
          className="flex items-center justify-center gap-2 p-3 bg-white border border-slate-200 rounded-xl font-semibold text-xs text-slate-700 shadow-xs hover:bg-slate-50"
        >
          <Users className="w-4 h-4 text-indigo-500" /> Manage Staff
        </button>
      </div>
    </div>
  );
}