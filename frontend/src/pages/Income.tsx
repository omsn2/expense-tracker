import { useCallback, useEffect, useState } from 'react';
import { HiTrash, HiTrendingUp } from 'react-icons/hi';
import { format } from 'date-fns';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend } from 'recharts';

type Income = {
    id: number;
    amount: number;
    source: string;
    category: string;
    note?: string;
    date: string;
};

type CashFlow = {
    year: number;
    month: number;
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    savingsRate: number;
    incomeCount: number;
    expenseCount: number;
    monthlyTrend: Array<{
        month: string;
        income: number;
        expenses: number;
        savings: number;
    }>;
};

export default function Income() {
    const [income, setIncome] = useState<Income[]>([]);
    const [cashFlow, setCashFlow] = useState<CashFlow | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    const CATEGORY_OPTIONS = ['Salary', 'Freelance', 'Investment', 'Gift', 'Bonus', 'Other'];

    const loadIncome = useCallback(async () => {
        try {
            const [incomeData, cashFlowData] = await Promise.all([
                fetch('/api/income').then(r => r.json()),
                fetch('/api/cashflow').then(r => r.json())
            ]);
            setIncome(incomeData);
            setCashFlow(cashFlowData);
        } catch (e) {
            console.error('Failed to load income:', e);
        }
    }, []);

    useEffect(() => {
        loadIncome();
    }, [loadIncome]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const amount = Number(form.amount.value);
        const source = form.source.value;
        const category = form.category.value;
        const date = form.date.value || new Date().toISOString();
        const note = form.note.value || '';

        try {
            await fetch('/api/income', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, source, category, date, note })
            });
            form.reset();
            setIsAdding(false);
            loadIncome();
        } catch (e) {
            console.error('Failed to add income:', e);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this income?')) return;
        try {
            await fetch(`/api/income/${id}`, { method: 'DELETE' });
            loadIncome();
        } catch (e) {
            console.error('Failed to delete income:', e);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Income & Cash Flow</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Track your income and see your actual savings
                    </p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                    {isAdding ? 'Cancel' : 'Add Income'}
                </button>
            </div>

            {/* Cash Flow Summary */}
            {cashFlow && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow-lg text-white">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm opacity-90">Total Income</div>
                            <HiTrendingUp className="w-6 h-6" />
                        </div>
                        <div className="text-3xl font-bold">₹{cashFlow.totalIncome.toFixed(2)}</div>
                        <div className="text-xs opacity-75 mt-1">{cashFlow.incomeCount} transactions</div>
                    </div>

                    <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-lg shadow-lg text-white">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm opacity-90">Total Expenses</div>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                            </svg>
                        </div>
                        <div className="text-3xl font-bold">₹{cashFlow.totalExpenses.toFixed(2)}</div>
                        <div className="text-xs opacity-75 mt-1">{cashFlow.expenseCount} transactions</div>
                    </div>

                    <div className={`bg-gradient-to-br ${cashFlow.netSavings >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} p-6 rounded-lg shadow-lg text-white`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm opacity-90">Net Savings</div>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="text-3xl font-bold">₹{cashFlow.netSavings.toFixed(2)}</div>
                        <div className="text-xs opacity-75 mt-1">{cashFlow.netSavings >= 0 ? 'Surplus' : 'Deficit'}</div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg shadow-lg text-white">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm opacity-90">Savings Rate</div>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div className="text-3xl font-bold">{cashFlow.savingsRate.toFixed(1)}%</div>
                        <div className="text-xs opacity-75 mt-1">of income saved</div>
                    </div>
                </div>
            )}

            {/* Add Form */}
            {isAdding && (
                <form onSubmit={handleAdd} className="bg-white p-6 rounded-lg shadow-sm space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                            <input
                                type="number"
                                name="amount"
                                step="0.01"
                                required
                                min="0"
                                placeholder="50000"
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Source *</label>
                            <input
                                type="text"
                                name="source"
                                required
                                placeholder="e.g., Monthly Salary"
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                name="category"
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                            >
                                {CATEGORY_OPTIONS.map(cat => (
                                    <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input
                                type="date"
                                name="date"
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                            <input
                                type="text"
                                name="note"
                                placeholder="Optional note"
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Add Income
                        </button>
                    </div>
                </form>
            )}

            {/* Cash Flow Chart */}
            {cashFlow && cashFlow.monthlyTrend.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">6-Month Cash Flow Trend</h3>
                    <div style={{ width: '100%', height: 350 }}>
                        <ResponsiveContainer>
                            <LineChart data={cashFlow.monthlyTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" />
                                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
                                <Line type="monotone" dataKey="savings" stroke="#3b82f6" strokeWidth={2} name="Savings" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Income List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold">Income History</h3>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {income.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center">
                                        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-lg font-medium mb-2">No income recorded yet</p>
                                        <p className="text-sm mb-4">Start tracking your income to see your savings</p>
                                        <button
                                            onClick={() => setIsAdding(true)}
                                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                                        >
                                            Add Your First Income
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            income.map(inc => (
                                <tr key={inc.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {format(new Date(inc.date), 'MMM d, yyyy')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                                        +₹{inc.amount.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {inc.source}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 capitalize">
                                            {inc.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {inc.note}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleDelete(inc.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <HiTrash className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
