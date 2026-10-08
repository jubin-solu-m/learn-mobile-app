import { useState, useEffect } from 'react';
import { db, type Staff } from '../db/db';
import { formatCurrency } from '../utils/formatters';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PayrollViewProps {
  onOpenStaff: (staffId: string) => void;
}

interface EmployeePayrollSummary {
  staff: Staff;
  fullDays: number;
  halfDays: number;
  leaveDays: number;
  totalWage: number;
  paidWage: number;
  pendingWage: number;
  advanceAmount: number;
}

export default function PayrollView({ onOpenStaff }: PayrollViewProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return new Date().toISOString().slice(0, 7); // YYYY-MM
  });

  const [summaries, setSummaries] = useState<EmployeePayrollSummary[]>([]);
  const [totals, setTotals] = useState({ wage: 0, paid: 0, pending: 0, advances: 0 });

  useEffect(() => {
    calculatePayroll(selectedMonth);
  }, [selectedMonth]);

  const calculatePayroll = async (month: string) => {
    const allStaff = await db.staff.toArray();
    const attendanceRecords = await db.attendance.toArray();
    const advanceRecords = await db.advances.toArray();

    // Filter to selected month
    const monthAttendance = attendanceRecords.filter(a => a.date.startsWith(month));
    const monthAdvances = advanceRecords.filter(a => a.date.startsWith(month));

    let sumWage = 0, sumPaid = 0, sumPending = 0, sumAdv = 0;

    const list: EmployeePayrollSummary[] = allStaff.map(staff => {
      const records = monthAttendance.filter(a => a.staff_id === staff.staff_id);
      const advances = monthAdvances.filter(a => a.staff_id === staff.staff_id);

      let fullDays = 0, halfDays = 0, leaveDays = 0;
      let totalWage = 0, paidWage = 0;

      records.forEach(r => {
        if (r.status === 'full') fullDays++;
        if (r.status === 'half') halfDays++;
        if (r.status === 'leave') leaveDays++;

        totalWage += r.calculated_wage;
        if (r.payment_status === 'paid') {
          paidWage += r.calculated_wage;
        }
      });

      const pendingWage = totalWage - paidWage;
      const advanceAmount = advances.reduce((sum, a) => sum + a.amount, 0);

      sumWage += totalWage;
      sumPaid += paidWage;
      sumPending += pendingWage;
      sumAdv += advanceAmount;

      return {
        staff,
        fullDays,
        halfDays,
        leaveDays,
        totalWage,
        paidWage,
        pendingWage,
        advanceAmount,
      };
    });

    setSummaries(list);
    setTotals({ wage: sumWage, paid: sumPaid, pending: sumPending, advances: sumAdv });
  };

  const handleMonthStep = (step: number) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m - 1 + step, 1);
    setSelectedMonth(date.toISOString().slice(0, 7));
  };

  const displayMonthName = new Date(selectedMonth + '-01').toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="p-4 space-y-4">
      {/* Month Navigator Header */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Monthly Payroll</h1>
          <p className="text-xs text-slate-500">Calculated from actual attendance</p>
        </div>

        <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-1 shadow-2xs">
          <button onClick={() => handleMonthStep(-1)} className="p-1 hover:bg-slate-100 rounded text-slate-600">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-800 px-1">{displayMonthName}</span>
          <button onClick={() => handleMonthStep(1)} className="p-1 hover:bg-slate-100 rounded text-slate-600">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Aggregate Grand Totals Card */}
      <div className="bg-indigo-900 text-white rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex justify-between items-center border-b border-indigo-800 pb-2">
          <span className="text-xs font-medium text-indigo-200 uppercase tracking-wider">Total Month Payroll</span>
          <span className="text-lg font-extrabold">{formatCurrency(totals.wage)}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-indigo-800/60 p-2 rounded-lg">
            <span className="text-emerald-300 block text-[10px]">Total Paid</span>
            <span className="font-bold text-white text-xs">{formatCurrency(totals.paid)}</span>
          </div>
          <div className="bg-indigo-800/60 p-2 rounded-lg">
            <span className="text-rose-300 block text-[10px]">Total Pending</span>
            <span className="font-bold text-white text-xs">{formatCurrency(totals.pending)}</span>
          </div>
          <div className="bg-indigo-800/60 p-2 rounded-lg">
            <span className="text-amber-300 block text-[10px]">Advances</span>
            <span className="font-bold text-white text-xs">{formatCurrency(totals.advances)}</span>
          </div>
        </div>
      </div>

      {/* Employee List Summaries */}
      <div className="space-y-3">
        {summaries.map(item => (
          <div
            key={item.staff.staff_id}
            onClick={() => onOpenStaff(item.staff.staff_id)}
            className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs space-y-2.5 cursor-pointer hover:border-indigo-300 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">{item.staff.name}</h3>
                <span className="text-[10px] text-slate-400 font-mono">{item.staff.staff_id}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-extrabold text-slate-800 block">{formatCurrency(item.totalWage)}</span>
                <span className="text-[10px] text-slate-400">Total Wage</span>
              </div>
            </div>

            {/* Attendance Days Pill Count */}
            <div className="flex gap-2 text-[11px] bg-slate-50 rounded-lg p-2 border border-slate-100 text-center">
              <span className="flex-1 font-medium text-slate-700">
                <strong className="text-emerald-700 font-bold">{item.fullDays}</strong> Full
              </span>
              <span className="flex-1 font-medium text-slate-700">
                <strong className="text-amber-700 font-bold">{item.halfDays}</strong> Half
              </span>
              <span className="flex-1 font-medium text-slate-700">
                <strong className="text-rose-700 font-bold">{item.leaveDays}</strong> Leave
              </span>
            </div>

            {/* Financial Status Breakdown */}
            <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 block">Paid</span>
                <span className="font-bold text-emerald-600">{formatCurrency(item.paidWage)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Pending</span>
                <span className="font-bold text-rose-600">{formatCurrency(item.pendingWage)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Advance</span>
                <span className="font-bold text-indigo-600">{formatCurrency(item.advanceAmount)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}