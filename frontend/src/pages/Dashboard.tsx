import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

type Expense = { id: number; amount: number; category: string; note?: string; date: string };
type Todo = { id: number; title: string; done: boolean; createdAt: string };

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [stats, setStats] = useState<any>(null);

  const loadAll = useCallback(async () => {
    try {
      const [expRes, todoRes, statsRes] = await Promise.all([
        fetch('/api/expenses?limit=1000'),
        fetch('/api/todos'),
        fetch('/api/expenses/stats')
      ]);
      const [expData, todoData, statsData] = await Promise.all([expRes.json(), todoRes.json(), statsRes.json()]);
      setExpenses(expData);
      setTodos(todoData);
      setStats(statsData);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const recentExpenses = useMemo(() => expenses.slice(0, 5), [expenses]);
  const pendingTodos = useMemo(() => todos.filter(t => !t.done), [todos]);
  const completedTodos = useMemo(() => todos.filter(t => t.done), [todos]);

  // monthly trend last 6 months
  const monthlySeries = useMemo(() => {
    const now = new Date();
    const months: { label: string; year: number; month: number; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ label: format(d, 'MMM yyyy'), year: d.getFullYear(), month: d.getMonth() + 1, total: 0 });
    }
    expenses.forEach(e => {
      const d = new Date(e.date);
      const idx = months.findIndex(m => m.year === d.getFullYear() && m.month === d.getMonth() + 1);
      if (idx >= 0) months[idx].total += e.amount;
    });
    return months.map(m => ({ name: m.label, total: Number(m.total.toFixed(2)) }));
  }, [expenses]);

  const completionRate = todos.length ? Math.round((completedTodos.length / todos.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <div className="text-sm text-gray-500">Updated live — overview of your expenses and todos</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-500">Today</div>
          <div className="text-2xl font-bold text-blue-600">${(stats?.today?.total || 0).toFixed(2)}</div>
          <div className="text-xs text-gray-500">{stats?.today?.count || 0} expenses</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-500">This month</div>
          <div className="text-2xl font-bold text-green-600">${(stats?.thisMonth?.total || 0).toFixed(2)}</div>
          <div className="text-xs text-gray-500">{stats?.thisMonth?.count || 0} expenses</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-500">Todos</div>
          <div className="text-2xl font-bold text-indigo-600">{pendingTodos.length} pending</div>
          <div className="text-xs text-gray-500">{completedTodos.length} completed — {completionRate}% completion</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium">6-Month Expense Trend</h3>
            <Link to="/expenses" className="text-sm text-blue-600">View expenses</Link>
          </div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={monthlySeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#3182ce" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium">Recent Activity</h3>
            <Link to="/todos" className="text-sm text-blue-600">Manage</Link>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-500">Recent expenses</div>
              {recentExpenses.length === 0 ? <div className="text-sm text-gray-500">No recent expenses</div> : recentExpenses.map(e => (
                <div key={e.id} className="flex justify-between text-sm">
                  <div className="text-gray-700">{e.category} {e.note ? `— ${e.note}` : ''}</div>
                  <div className="font-medium">${e.amount.toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div>
              <div className="text-sm text-gray-500">Recent todos</div>
              {pendingTodos.slice(0,5).length === 0 ? <div className="text-sm text-gray-500">No pending todos</div> : pendingTodos.slice(0,5).map(t => (
                <div key={t.id} className="text-sm">{t.title}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}