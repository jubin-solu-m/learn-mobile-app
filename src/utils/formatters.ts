export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
};

export const getTodayDateString = () => new Date().toISOString().split('T')[0];

export const getMonthYearString = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
};