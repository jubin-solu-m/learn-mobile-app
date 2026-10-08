import { useState, useEffect } from 'react';
import { db, type Staff, type Attendance, type AttendanceStatus, type PaymentStatus } from '../db/db';
import { formatCurrency, getTodayDateString } from '../utils/formatters';
import { Calendar, CheckCircle2, CircleDollarSign, Edit3, X } from 'lucide-react';

interface AttendanceRowItem {
  staff: Staff;
  record?: Attendance;
  currentWage: number;
  status: AttendanceStatus;
  calculatedWage: number;
  paymentStatus: PaymentStatus;
}

export default function AttendanceView() {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [rows, setRows] = useState<AttendanceRowItem[]>([]);
  const [editingWageStaffId, setEditingWageStaffId] = useState<string | null>(null);
  const [customWageInput, setCustomWageInput] = useState<string>('');

  useEffect(() => {
    loadAttendanceSheet(selectedDate);
  }, [selectedDate]);

  const loadAttendanceSheet = async (date: string) => {
    const activeStaff = await db.staff.where('active').equals(1).toArray();
    const existingRecords = await db.attendance.where('date').equals(date).toArray();
    const recordsMap = new Map(existingRecords.map(r => [r.staff_id, r]));

    const computedRows: AttendanceRowItem[] = activeStaff.map(s => {
      const rec = recordsMap.get(s.staff_id);
      if (rec) {
        return {
          staff: s,
          record: rec,
          currentWage: rec.daily_wage,
          status: rec.status,
          calculatedWage: rec.calculated_wage,
          paymentStatus: rec.payment_status,
        };
      } else {
        // Defaults to Full Day uncommitted
        return {
          staff: s,
          currentWage: s.default_daily_wage,
          status: 'full',
          calculatedWage: s.default_daily_wage,
          paymentStatus: 'unpaid',
        };
      }
    });

    setRows(computedRows);
  };

  const calculateWage = (status: AttendanceStatus, dailyWage: number) => {
    if (status === 'full') return dailyWage;
    if (status === 'half') return Math.round(dailyWage / 2);
    return 0;
  };

  const handleStatusChange = async (staffId: string, newStatus: AttendanceStatus) => {
    const row = rows.find(r => r.staff.staff_id === staffId);
    if (!row) return;

    const calc = calculateWage(newStatus, row.currentWage);
    await saveRecord(staffId, newStatus, row.currentWage, calc, row.paymentStatus);
  };

  const handlePaymentToggle = async (staffId: string) => {
    const row = rows.find(r => r.staff.staff_id === staffId);
    if (!row) return;

    const nextPaymentStatus: PaymentStatus = row.paymentStatus === 'paid' ? 'unpaid' : 'paid';
    await saveRecord(staffId, row.status, row.currentWage, row.calculatedWage, nextPaymentStatus);
  };

  const saveRecord = async (
    staffId: string,
    status: AttendanceStatus,
    wage: number,
    calculated: number,
    paymentStatus: PaymentStatus
  ) => {
    const existing = await db.attendance.where({ staff_id: staffId, date: selectedDate }).first();
    const recordPayload: Attendance = {
      staff_id: staffId,
      date: selectedDate,
      status,
      daily_wage: wage,
      calculated_wage: calculated,
      payment_status: paymentStatus,
      payment_date: paymentStatus === 'paid' ? selectedDate : undefined,
      payment_amount: paymentStatus === 'paid' ? calculated : 0,
      created_at: existing ? existing.created_at : new Date().toISOString(),
    };

    if (existing?.id) {
      await db.attendance.update(existing.id, recordPayload);
    } else {
      await db.attendance.add(recordPayload);
    }
    loadAttendanceSheet(selectedDate);
  };

  const applyCustomWage = async (staffId: string) => {
    const newWage = parseFloat(customWageInput);
    if (isNaN(newWage) || newWage < 0) return;

    const row = rows.find(r => r.staff.staff_id === staffId);
    if (!row) return;

    const calc = calculateWage(row.status, newWage);
    await saveRecord(staffId, row.status, newWage, calc, row.paymentStatus);
    setEditingWageStaffId(null);
    setCustomWageInput('');
  };

  return (
    <div className="p-4 space-y-4">
      {/* Date Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Daily Attendance</h1>
          <p className="text-xs text-slate-500">Pick date & mark staff presence</p>
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 shadow-2xs">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-semibold text-slate-800 bg-transparent outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Staff List Cards */}
      <div className="space-y-3">
        {rows.map((row) => {
          const isOverridden = row.currentWage !== row.staff.default_daily_wage;
          const isEditingWage = editingWageStaffId === row.staff.staff_id;

          return (
            <div
              key={row.staff.staff_id}
              className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs space-y-3"
            >
              {/* Employee row info */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm leading-tight">{row.staff.name}</h3>
                  <span className="text-[11px] text-slate-400 font-medium">{row.staff.staff_id}</span>
                </div>

                {/* Daily Wage Display with Override triggers */}
                <div className="text-right">
                  {!isEditingWage ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-700">
                        ₹{row.currentWage}
                        {isOverridden && <span className="text-[10px] text-indigo-600 ml-1 font-semibold">(Custom)</span>}
                      </span>
                      <button
                        onClick={() => {
                          setEditingWageStaffId(row.staff.staff_id);
                          setCustomWageInput(String(row.currentWage));
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded-sm"
                        title="Override Wage for Today"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={customWageInput}
                        onChange={(e) => setCustomWageInput(e.target.value)}
                        placeholder="Wage"
                        className="w-16 px-1.5 py-0.5 text-xs font-bold border border-indigo-400 rounded-sm outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => applyCustomWage(row.staff.staff_id)}
                        className="text-[10px] bg-indigo-600 text-white px-1.5 py-1 rounded-sm font-semibold"
                      >
                        Set
                      </button>
                      <button
                        onClick={() => setEditingWageStaffId(null)}
                        className="text-slate-400 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400">Default: ₹{row.staff.default_daily_wage}</div>
                </div>
              </div>

              {/* Attendance Options Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleStatusChange(row.staff.staff_id, 'full')}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                    row.status === 'full'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Full Day
                </button>
                <button
                  onClick={() => handleStatusChange(row.staff.staff_id, 'half')}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                    row.status === 'half'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Half Day
                </button>
                <button
                  onClick={() => handleStatusChange(row.staff.staff_id, 'leave')}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                    row.status === 'leave'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Leave
                </button>
              </div>

              {/* Calculated Wage & Payment State */}
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Calculated Wage</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {formatCurrency(row.calculatedWage)}
                  </span>
                </div>

                <button
                  onClick={() => handlePaymentToggle(row.staff.staff_id)}
                  disabled={row.calculatedWage === 0}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                    row.calculatedWage === 0
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : row.paymentStatus === 'paid'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  {row.paymentStatus === 'paid' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Paid
                    </>
                  ) : (
                    <>
                      <CircleDollarSign className="w-3.5 h-3.5 text-rose-500" /> Mark Paid
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}