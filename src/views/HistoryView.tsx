import { useState, useEffect } from 'react';
import { db, type Attendance, type Staff } from '../db/db';
import { formatCurrency } from '../utils/formatters';

interface HistoryViewProps {
  onOpenStaff: (staffId: string) => void;
}

export default function HistoryView({ onOpenStaff }: HistoryViewProps) {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [staffMap, setStaffMap] = useState<Map<string, Staff>>(new Map());

  // Filters
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState(() => new Date().toISOString().slice(0, 7));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const allStaff = await db.staff.toArray();
    setStaffMap(new Map(allStaff.map(s => [s.staff_id, s])));

    const allAttendance = await db.attendance.reverse().sortBy('date');
    setRecords(allAttendance);
  };

  const filteredRecords = records.filter(r => {
    if (monthFilter && !r.date.startsWith(monthFilter)) return false;
    if (employeeFilter !== 'all' && r.staff_id !== employeeFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (paymentFilter !== 'all' && r.payment_status !== paymentFilter) return false;
    return true;
  });

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-800">History & Audit</h1>
        <p className="text-xs text-slate-500">Filter past attendance and wage payouts</p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Month</label>
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Staff</label>
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
            >
              <option value="all">All Staff</option>
              {Array.from(staffMap.values()).map(s => (
                <option key={s.staff_id} value={s.staff_id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
            >
              <option value="all">All Types</option>
              <option value="full">Full Day</option>
              <option value="half">Half Day</option>
              <option value="leave">Leave</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Payment</label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Record Counter */}
      <div className="text-xs font-semibold text-slate-500 px-1">
        Showing {filteredRecords.length} records
      </div>

      {/* Records Table Card */}
      <div className="space-y-2">
        {filteredRecords.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-8">No matching records found.</p>
        ) : (
          filteredRecords.map(r => {
            const staff = staffMap.get(r.staff_id);
            return (
              <div
                key={r.id}
                onClick={() => onOpenStaff(r.staff_id)}
                className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center text-xs shadow-2xs hover:border-indigo-300 cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800">{staff?.name || r.staff_id}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({r.date})</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase ${
                    r.status === 'full' ? 'text-emerald-700' : r.status === 'half' ? 'text-amber-700' : 'text-rose-700'
                  }`}>
                    {r.status} Day (Wage: ₹{r.daily_wage})
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-slate-900 block">{formatCurrency(r.calculated_wage)}</span>
                  <span className={`text-[10px] font-bold ${r.payment_status === 'paid' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {r.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}