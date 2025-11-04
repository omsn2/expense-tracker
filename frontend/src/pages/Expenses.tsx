import { format } from 'date-fns';
import { HiTrash } from 'react-icons/hi';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';

type Expense = {
  id: number;
  amount: number;
  category: string;
  note?: string;
  date: string;
};

type ExpenseStats = {
  today: {
    total: number;
    count: number;
    byCategory: Record<string, number>;
  };
  thisMonth: {
    total: number;
    count: number;
    byCategory: Record<string, number>;
  };
};

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [filterYear, setFilterYear] = useState<number | 'all'>('all');
  const [filterMonth, setFilterMonth] = useState<number | 'all'>('all');
  const [customCategoryVisible, setCustomCategoryVisible] = useState(false);

  const CATEGORY_OPTIONS = ['Travel', 'Food', 'Groceries', 'Utilities', 'Entertainment', 'Health', 'Other', 'Custom'];

  const loadExpenses = useCallback(async () => {
    try {
      const [expensesData, statsData] = await Promise.all([
        fetch('/api/expenses').then(r => r.json()),
        fetch('/api/expenses/stats').then(r => r.json())
      ]);
      setExpenses(expensesData);
      setStats(statsData);
    } catch (e) {
      console.error('Failed to load expenses:', e);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // Derived filtered list
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.date);
      if (filterYear !== 'all' && d.getFullYear() !== filterYear) return false;
      if (filterMonth !== 'all' && d.getMonth() + 1 !== filterMonth) return false;
      return true;
    }).slice(0, 1000);
  }, [expenses, filterYear, filterMonth]);

  // Aggregation for charts
  const categorySeries = useMemo(() => {
    const agg: Record<string, number> = {};
    filteredExpenses.forEach(e => { agg[e.category] = (agg[e.category] || 0) + e.amount; });
    return Object.entries(agg).map(([category, total]) => ({ category, total }));
  }, [filteredExpenses]);

  // Monthly trend (last 6 months)
  const monthlySeries = useMemo(() => {
    const now = new Date();
    const months: { label: string; year: number; month: number; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ label: format(d, 'MMM yyyy'), year: d.getFullYear(), month: d.getMonth() + 1, total: 0 });
    }
    filteredExpenses.forEach(e => {
      const d = new Date(e.date);
      const idx = months.findIndex(m => m.year === d.getFullYear() && m.month === d.getMonth() + 1);
      if (idx >= 0) months[idx].total += e.amount;
    });
    return months.map(m => ({ name: m.label, total: Number(m.total.toFixed(2)) }));
  }, [filteredExpenses]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const amount = Number(form.amount.value);
    let category = form.category.value;
    if (category === 'Custom') {
      category = (form.customCategory as HTMLInputElement).value || 'Custom';
    }
    const note = form.note.value;
    const date = form.date.value || new Date().toISOString();

    try {
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, category, note, date })
      });
      form.reset();
      setIsAdding(false);
      loadExpenses();
    } catch (e) {
      console.error('Failed to add expense:', e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      loadExpenses();
    } catch (e) {
      console.error('Failed to delete expense:', e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Expenses</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {isAdding ? 'Cancel' : 'Add Expense'}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium mb-2">Today</h3>
            <p className="text-2xl font-bold text-blue-600">${stats.today.total.toFixed(2)}</p>
            <p className="text-sm text-gray-500">{stats.today.count} expenses</p>
            {Object.entries(stats.today.byCategory).map(([category, amount]) => (
              <div key={category} className="mt-2 flex justify-between text-sm">
                <span className="text-gray-600">{category}</span>
                <span className="font-medium">${amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium mb-2">This Month</h3>
            <p className="text-2xl font-bold text-green-600">${stats.thisMonth.total.toFixed(2)}</p>
            <p className="text-sm text-gray-500">{stats.thisMonth.count} expenses</p>
            {Object.entries(stats.thisMonth.byCategory).map(([category, amount]) => (
              <div key={category} className="mt-2 flex justify-between text-sm">
                <span className="text-gray-600">{category}</span>
                <span className="font-medium">${amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Form */}
      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-lg shadow-sm space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount ($)</label>
              <input
                type="number"
                name="amount"
                step="0.01"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select name="category" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" onChange={(ev) => setCustomCategoryVisible(ev.target.value === 'Custom')}>
                {CATEGORY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              {customCategoryVisible && (
                <input name="customCategory" placeholder="Custom category" className="mt-2 block w-full rounded-md border-gray-300 shadow-sm" />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                name="date"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Note</label>
              <input
                type="text"
                name="note"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Save Expense
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex gap-2 items-center">
        <label className="text-sm text-gray-600">Year</label>
        <select value={filterYear} onChange={e => setFilterYear(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="rounded-md border-gray-300">
          <option value="all">All</option>
          {Array.from({ length: 5 }).map((_, i) => {
            const y = new Date().getFullYear() - i;
            return <option key={y} value={y}>{y}</option>;
          })}
        </select>
        <label className="text-sm text-gray-600">Month</label>
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="rounded-md border-gray-300">
          <option value="all">All</option>
          {Array.from({ length: 12 }).map((_, i) => <option key={i} value={i + 1}>{format(new Date(0, i), 'MMMM')}</option>)}
        </select>
        <button onClick={() => { const d = new Date(); d.setMonth(d.getMonth() -1); setFilterYear(d.getFullYear()); setFilterMonth(d.getMonth() +1); }} className="ml-2 text-sm text-gray-600">Last month</button>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h4 className="text-sm font-medium mb-2">Expenses by Category</h4>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={categorySeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#3182ce" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h4 className="text-sm font-medium mb-2">6-Month Trend</h4>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={monthlySeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {expenses.map(expense => (
              <tr key={expense.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {format(new Date(expense.date), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ${expense.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {expense.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {expense.note}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <HiTrash className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}