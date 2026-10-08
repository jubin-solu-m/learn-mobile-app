import { useState, useEffect } from 'react';
import { Home, CalendarCheck2, Users, Receipt, History } from 'lucide-react';
import { seedInitialData } from './db/db';
import DashboardView from './views/DashboardView';
import AttendanceView from './views/AttendanceView';
import StaffView from './views/StaffView';
import PayrollView from './views/PayrollView';
import HistoryView from './views/HistoryView';
import EmployeeDetailView from './views/EmployeeDetailView';

export type NavigationTab = 'home' | 'attendance' | 'payroll' | 'staff' | 'history';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  useEffect(() => {
    seedInitialData();
  }, []);

  const openEmployee = (staffId: string) => {
    setSelectedStaffId(staffId);
  };

  const closeEmployee = () => {
    setSelectedStaffId(null);
  };

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-slate-50 border-x border-slate-200 shadow-sm relative pb-20">
      {/* Dynamic Content */}
      <main className="flex-1 overflow-y-auto">
        {selectedStaffId ? (
          <EmployeeDetailView staffId={selectedStaffId} onBack={closeEmployee} />
        ) : (
          <>
            {currentTab === 'home' && <DashboardView onNavigate={setCurrentTab} onOpenStaff={openEmployee} />}
            {currentTab === 'attendance' && <AttendanceView />}
            {currentTab === 'payroll' && <PayrollView onOpenStaff={openEmployee} />}
            {currentTab === 'staff' && <StaffView onOpenStaff={openEmployee} />}
            {currentTab === 'history' && <HistoryView onOpenStaff={openEmployee} />}
          </>
        )}
      </main>

      {/* Mobile-First Bottom Navigation */}
      {!selectedStaffId && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200 px-2 py-1.5 flex justify-around items-center z-40">
          <button
            onClick={() => setCurrentTab('home')}
            className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
              currentTab === 'home' ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Home</span>
          </button>

          <button
            onClick={() => setCurrentTab('attendance')}
            className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
              currentTab === 'attendance' ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarCheck2 className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Attendance</span>
          </button>

          <button
            onClick={() => setCurrentTab('payroll')}
            className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
              currentTab === 'payroll' ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Payroll</span>
          </button>

          <button
            onClick={() => setCurrentTab('staff')}
            className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
              currentTab === 'staff' ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Staff</span>
          </button>

          <button
            onClick={() => setCurrentTab('history')}
            className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
              currentTab === 'history' ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">History</span>
          </button>
        </nav>
      )}
    </div>
  );
}