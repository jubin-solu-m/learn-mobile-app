import { useState, useEffect, type FormEvent, type MouseEvent } from 'react';
import { db, type Staff } from '../db/db';
import { formatCurrency, getTodayDateString } from '../utils/formatters';
import { UserPlus, Phone, Edit, UserX, UserCheck } from 'lucide-react';

interface StaffViewProps {
  onOpenStaff: (staffId: string) => void;
}

export default function StaffView({ onOpenStaff }: StaffViewProps) {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [staffId, setStaffId] = useState('');
  const [phone, setPhone] = useState('');
  const [wage, setWage] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    const all = await db.staff.toArray();
    setStaffList(all);
  };

  const handleSaveStaff = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !wage) return;

    const wageNum = parseFloat(wage);
    if (isNaN(wageNum) || wageNum < 0) return;

    if (editingStaff?.id) {
      // Editing existing staff
      await db.staff.update(editingStaff.id, {
        name,
        phone,
        default_daily_wage: wageNum,
        notes,
      });
    } else {
      // Adding new staff
      const generatedId = staffId.trim() || `EMP${String(staffList.length + 1).padStart(3, '0')}`;
      await db.staff.add({
        staff_id: generatedId,
        name,
        phone,
        default_daily_wage: wageNum,
        joining_date: getTodayDateString(),
        active: true,
        notes,
        created_at: getTodayDateString(),
      });
    }

    closeModal();
    loadStaff();
  };

  const toggleStaffActive = async (staff: Staff, e: MouseEvent) => {
    e.stopPropagation();
    if (!staff.id) return;
    await db.staff.update(staff.id, { active: !staff.active });
    loadStaff();
  };

  const openEdit = (staff: Staff, e: MouseEvent) => {
    e.stopPropagation();
    setEditingStaff(staff);
    setName(staff.name);
    setStaffId(staff.staff_id);
    setPhone(staff.phone);
    setWage(String(staff.default_daily_wage));
    setNotes(staff.notes || '');
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingStaff(null);
    setName('');
    setStaffId('');
    setPhone('');
    setWage('');
    setNotes('');
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Staff Members</h1>
          <p className="text-xs text-slate-500">{staffList.length} Total Registered</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs hover:bg-indigo-700"
        >
          <UserPlus className="w-3.5 h-3.5" /> Add Staff
        </button>
      </div>

      {/* Staff Cards List */}
      <div className="space-y-2.5">
        {staffList.map((staff) => (
          <div
            key={staff.staff_id}
            onClick={() => onOpenStaff(staff.staff_id)}
            className={`bg-white rounded-xl p-3.5 border shadow-2xs flex justify-between items-center cursor-pointer transition-all ${
              staff.active ? 'border-slate-200 hover:border-indigo-300' : 'border-slate-200 opacity-60 bg-slate-50'
            }`}
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-800">{staff.name}</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                  {staff.staff_id}
                </span>
                {!staff.active && (
                  <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-semibold">
                    Inactive
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{formatCurrency(staff.default_daily_wage)}/day</span>
                {staff.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> {staff.phone}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={(e) => openEdit(staff, e)}
                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md"
                title="Edit Staff"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => toggleStaffActive(staff, e)}
                className={`p-1.5 rounded-md ${
                  staff.active ? 'text-slate-400 hover:text-rose-600' : 'text-emerald-600 hover:text-emerald-700'
                }`}
                title={staff.active ? 'Deactivate' : 'Activate'}
              >
                {staff.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl border border-slate-100">
            <h2 className="text-base font-bold text-slate-800">
              {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
            </h2>

            <form onSubmit={handleSaveStaff} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Singh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                />
              </div>

              {!editingStaff && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Staff ID (Auto if blank)</label>
                  <input
                    type="text"
                    placeholder="e.g. EMP004"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Default Daily Wage (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 800"
                  value={wage}
                  onChange={(e) => setWage(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Role, skills, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  Save Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}