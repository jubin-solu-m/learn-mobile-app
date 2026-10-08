import Dexie, { type Table } from 'dexie';

export type AttendanceStatus = 'full' | 'half' | 'leave';
export type PaymentStatus = 'paid' | 'unpaid';

export interface Staff {
  id?: number;
  staff_id: string;
  name: string;
  phone: string;
  default_daily_wage: number;
  joining_date: string;
  active: boolean;
  notes?: string;
  created_at: string;
}

export interface Attendance {
  id?: number;
  staff_id: string; // references Staff.staff_id
  date: string;     // YYYY-MM-DD
  status: AttendanceStatus;
  daily_wage: number;        // Actual wage for that day (allows override)
  calculated_wage: number;   // Full = 100%, Half = 50%, Leave = 0
  payment_status: PaymentStatus;
  payment_date?: string;
  payment_amount: number;
  created_at: string;
}

export interface Advance {
  id?: number;
  staff_id: string;
  amount: number;
  date: string;     // YYYY-MM-DD
  reason?: string;
  notes?: string;
  created_at: string;
}

export class AppDatabase extends Dexie {
  staff!: Table<Staff, number>;
  attendance!: Table<Attendance, number>;
  advances!: Table<Advance, number>;

  constructor() {
    super('StaffPayDB');
    this.version(1).stores({
      staff: '++id, &staff_id, name, active',
      attendance: '++id, &[staff_id+date], staff_id, date, payment_status',
      advances: '++id, staff_id, date',
    });
  }
}

export const db = new AppDatabase();

// Seed initial sample data if clean install
export async function seedInitialData() {
  const staffCount = await db.staff.count();
  if (staffCount === 0) {
    const today = new Date().toISOString().split('T')[0];
    await db.staff.bulkAdd([
      { staff_id: 'EMP001', name: 'Ravi Kumar', phone: '9876543210', default_daily_wage: 800, joining_date: '2026-01-01', active: true, created_at: today },
      { staff_id: 'EMP002', name: 'Suresh Patel', phone: '9876543211', default_daily_wage: 750, joining_date: '2026-01-15', active: true, created_at: today },
      { staff_id: 'EMP003', name: 'Manoj Sharma', phone: '9876543212', default_daily_wage: 900, joining_date: '2026-02-01', active: true, created_at: today },
    ]);
  }
}