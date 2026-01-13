import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { HiExclamation } from 'react-icons/hi';

type Expense = { id: number; amount: number; category: string; note?: string; date: string };
type Todo = { id: number; title: string; done: boolean; createdAt: string };
type BudgetAlert = {
  id: number;
  category: string;
  amount: number;
  spent: number;
  percentage: number;
  isOverBudget: boolean;
  isNearLimit: boolean;
};

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [budgetAlerts, setBudgetAlerts] = useState<BudgetAlert[]>([]);
  const [upcomingRecurring, setUpcomingRecurring] = useState<any[]>([]);
  const [cashFlow, setCashFlow] = useState<any>(null);

  const loadAll = useCallback(async () => {
    try {
      const [expRes, todoRes, statsRes, budgetRes, recurringRes, cashFlowRes] = await Promise.all([
        fetch('/api/expenses?limit=1000'),
        fetch('/api/todos'),
        fetch('/api/expenses/stats'),
        fetch('/api/budgets/status'),
        fetch('/api/recurring-expenses/upcoming'),
        fetch('/api/cashflow')
      ]);
      const [expData, todoData, statsData, budgetData, recurringData, cashFlowData] = await Promise.all([
        expRes.json(),
        todoRes.json(),
        statsRes.json(),
        budgetRes.json(),
        recurringRes.json(),
        cashFlowRes.json()
      ]);
      setExpenses(expData);
      setTodos(todoData);
      setStats(statsData);
      setBudgetAlerts(budgetData.alerts || []);
      setUpcomingRecurring(recurringData.slice(0, 3) || []);
      setCashFlow(cashFlowData);
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

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
          <div className="flex items-start">
            <HiExclamation className="w-6 h-6 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-2">⚠️ Budget Alerts</h3>
              <div className="space-y-2">
                {budgetAlerts.map(alert => (
                  <div key={alert.id} className="text-sm">
                    <span className="font-medium text-red-800">{alert.category === 'overall' ? 'Overall Budget' : alert.category}</span>
                    <span className="text-red-700">
                      {' '}— {alert.isOverBudget ? '🔴 Over budget' : '⚠️ Near limit'} at{' '}
                      <strong>{alert.percentage}%</strong> (₹{alert.spent.toFixed(2)} / ₹{alert.amount.toFixed(2)})
                    </span>
                  </div>
                ))}
              </div>
              <Link to="/budgets" className="inline-block mt-3 text-sm text-red-700 font-medium hover:text-red-900 underline">
                Manage Budgets →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Recurring Expenses */}
      {upcomingRecurring.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 rounded-lg shadow-sm">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-blue-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">📅 Upcoming Bills</h3>
              <div className="space-y-2">
                {upcomingRecurring.map((rec: any) => (
                  <div key={rec.id} className="text-sm">
                    <span className="font-medium text-blue-800">{rec.name}</span>
                    <span className="text-blue-700">
                      {' '}— ₹{rec.amount.toFixed(2)} due on{' '}
                      {format(new Date(rec.nextOccurrence), 'MMM d, yyyy')}
                    </span>
                  </div>
                ))}
              </div>
              <Link to="/recurring" className="inline-block mt-3 text-sm text-blue-700 font-medium hover:text-blue-900 underline">
                Manage Recurring →
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-500">Today</div>
          <div className="text-2xl font-bold text-blue-600">₹{(stats?.today?.total || 0).toFixed(2)}</div>
          <div className="text-xs text-gray-500">{stats?.today?.count || 0} expenses</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-500">This month</div>
          <div className="text-2xl font-bold text-green-600">₹{(stats?.thisMonth?.total || 0).toFixed(2)}</div>
          <div className="text-xs text-gray-500">{stats?.thisMonth?.count || 0} expenses</div>
        </div>

        {cashFlow && (
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-500">Net Savings</div>
            <div className={`text-2xl font-bold ${cashFlow.netSavings >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              ₹{cashFlow.netSavings.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">{cashFlow.savingsRate.toFixed(1)}% savings rate</div>
          </div>
        )}

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
                  <div className="font-medium">₹{e.amount.toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div>
              <div className="text-sm text-gray-500">Recent todos</div>
              {pendingTodos.slice(0, 5).length === 0 ? <div className="text-sm text-gray-500">No pending todos</div> : pendingTodos.slice(0, 5).map(t => (
                <div key={t.id} className="text-sm">{t.title}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}