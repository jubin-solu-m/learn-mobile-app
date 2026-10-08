import { useState, useEffect, type FormEvent } from 'react';
import { db, type Staff, type Attendance, type Advance } from '../db/db';
import { formatCurrency, getTodayDateString } from '../utils/formatters';
import { ArrowLeft, Plus } from 'lucide-react';

interface EmployeeDetailProps {
  staffId: string;
  onBack: () => void;
}

export default function EmployeeDetailView({ staffId, onBack }: EmployeeDetailProps) {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'advances'>('attendance');

  // New Advance Modal Form State
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceDate, setAdvanceDate] = useState(getTodayDateString());
  const [advanceReason, setAdvanceReason] = useState('');

  const currentMonth = getTodayDateString().slice(0, 7);

  useEffect(() => {
    loadEmployeeFullProfile();
  }, [staffId]);

  const loadEmployeeFullProfile = async () => {
    const s = await db.staff.where('staff_id').equals(staffId).first();
    if (s) setStaff(s);

    const att = await db.attendance.where('staff_id').equals(staffId).reverse().sortBy('date');
    setAttendance(att);

    const adv = await db.advances.where('staff_id').equals(staffId).reverse().sortBy('date');
    setAdvances(adv);
  };

  const handleAddAdvance = async (e: FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(advanceAmount);
    if (isNaN(amt) || amt <= 0) return;

    await db.advances.add({
      staff_id: staffId,
      amount: amt,
      date: advanceDate,
      reason: advanceReason.trim() || undefined,
      created_at: new Date().toISOString(),
    });

    setShowAdvanceModal(false);
    setAdvanceAmount('');
    setAdvanceReason('');
    loadEmployeeFullProfile();
  };

  if (!staff) return null;

  // Month stats calculation
  const monthAttendance = attendance.filter(a => a.date.startsWith(currentMonth));
  const fullDays = monthAttendance.filter(a => a.status === 'full').length;
  const halfDays = monthAttendance.filter(a => a.status === 'half').length;
  const leaveDays = monthAttendance.filter(a => a.status === 'leave').length;
  const totalWage = monthAttendance.reduce((acc, a) => acc + a.calculated_wage, 0);
  const paidWage = monthAttendance.filter(a => a.payment_status === 'paid').reduce((acc, a) => acc + a.calculated_wage, 0);
  const pendingWage = totalWage - paidWage;

  const totalAdvanceAllTime = advances.reduce((acc, a) => acc + a.amount, 0);
  const monthAdvance = advances.filter(a => a.date.startsWith(currentMonth)).reduce((acc, a) => acc + a.amount, 0);

  return (
    <div className="p-4 space-y-4">
      {/* Top Bar Navigation */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
        <button onClick={onBack} className="p-1 hover:bg-slate-200 rounded-lg text-slate-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-800 leading-none">{staff.name}</h1>
          <span className="text-[11px] text-slate-400 font-mono">{staff.staff_id}</span>
        </div>
      </div>

      {/* Employee Quick Info Card */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500">Default Daily Wage:</span>
          <span className="font-bold text-slate-800 text-sm">{formatCurrency(staff.default_daily_wage)}/day</span>
        </div>

        {/* Current Month Progress */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            This Month's Summary
          </span>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">Full/Half/Leave</span>
              <span className="font-bold text-slate-800">{fullDays} / {halfDays} / {leaveDays}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Total Wage</span>
              <span className="font-bold text-slate-800">{formatCurrency(totalWage)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Pending</span>
              <span className="font-bold text-rose-600">{formatCurrency(pendingWage)}</span>
            </div>
          </div>
        </div>

        {/* Advances Summary */}
        <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">Month Advance: {formatCurrency(monthAdvance)}</span>
            <span className="font-bold text-indigo-700">Total Advance: {formatCurrency(totalAdvanceAllTime)}</span>
          </div>
          <button
            onClick={() => setShowAdvanceModal(true)}
            className="flex items-center gap-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-indigo-100"
          >
            <Plus className="w-3.5 h-3.5" /> Give Advance
          </button>
        </div>
      </div>

      {/* History Tabs Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors ${
            activeSubTab === 'attendance'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Attendance / Wages ({attendance.length})
        </button>
        <button
          onClick={() => setActiveSubTab('advances')}
          className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors ${
            activeSubTab === 'advances'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Advance History ({advances.length})
        </button>
      </div>

      {/* Tab: Attendance List */}
      {activeSubTab === 'attendance' && (
        <div className="space-y-2">
          {attendance.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-6">No attendance recorded yet.</p>
          ) : (
            attendance.map(a => (
              <div key={a.id} className="bg-white p-3 rounded-lg border border-slate-200 text-xs flex justify-between items-center shadow-2xs">
                <div>
                  <span className="font-bold text-slate-800 block">{a.date}</span>
                  <span className={`text-[10px] font-semibold uppercase ${
                    a.status === 'full' ? 'text-emerald-700' : a.status === 'half' ? 'text-amber-700' : 'text-rose-700'
                  }`}>
                    {a.status} day (₹{a.daily_wage}/day)
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-800 block text-sm">{formatCurrency(a.calculated_wage)}</span>
                  <span className={`text-[10px] font-bold ${a.payment_status === 'paid' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {a.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Advance History List */}
      {activeSubTab === 'advances' && (
        <div className="space-y-2">
          {advances.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-6">No advances recorded.</p>
          ) : (
            advances.map(adv => (
              <div key={adv.id} className="bg-white p-3 rounded-lg border border-slate-200 text-xs flex justify-between items-center shadow-2xs">
                <div>
                  <span className="font-bold text-slate-800 block">{adv.date}</span>
                  <span className="text-[11px] text-slate-500">{adv.reason || 'No note'}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-indigo-700 text-sm">{formatCurrency(adv.amount)}</span>
                  <span className="text-[10px] text-slate-400 block">Advance</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Advance Modal */}
      {showAdvanceModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl border border-slate-100">
            <h2 className="text-base font-bold text-slate-800">Give Advance to {staff.name}</h2>
            <form onSubmit={handleAddAdvance} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Advance Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 5000"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-bold"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={advanceDate}
                  onChange={(e) => setAdvanceDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Reason / Note</label>
                <input
                  type="text"
                  placeholder="Emergency, Festival, Medical..."
                  value={advanceReason}
                  onChange={(e) => setAdvanceReason(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  Save Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}