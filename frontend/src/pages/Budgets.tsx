import { useCallback, useEffect, useState } from 'react';
import { HiTrash, HiPencil, HiExclamation, HiCheckCircle } from 'react-icons/hi';

type Budget = {
    id: number;
    category: string;
    amount: number;
    period: 'monthly' | 'yearly';
    year: number | null;
    month: number | null;
    alertThreshold: number;
    createdAt: string;
    updatedAt: string;
};

type BudgetStatus = Budget & {
    spent: number;
    remaining: number;
    percentage: number;
    isOverBudget: boolean;
    isNearLimit: boolean;
    status: 'good' | 'warning' | 'over';
};

type BudgetStatusResponse = {
    year: number;
    month: number;
    budgets: BudgetStatus[];
    totalSpent: number;
    alerts: BudgetStatus[];
};

export default function Budgets() {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [budgetStatus, setBudgetStatus] = useState<BudgetStatusResponse | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editAmount, setEditAmount] = useState('');
    const [editThreshold, setEditThreshold] = useState('');

    const CATEGORY_OPTIONS = ['overall', 'Travel', 'Food', 'Groceries', 'Utilities', 'Entertainment', 'Health', 'Other'];

    const loadBudgets = useCallback(async () => {
        try {
            const [budgetsData, statusData] = await Promise.all([
                fetch('/api/budgets').then(r => r.json()),
                fetch('/api/budgets/status').then(r => r.json())
            ]);
            setBudgets(budgetsData);
            setBudgetStatus(statusData);
        } catch (e) {
            console.error('Failed to load budgets:', e);
        }
    }, []);

    useEffect(() => {
        loadBudgets();
    }, [loadBudgets]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const category = form.category.value;
        const amount = Number(form.amount.value);
        const period = form.period.value;
        const alertThreshold = Number(form.alertThreshold.value);

        try {
            await fetch('/api/budgets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category, amount, period, alertThreshold })
            });
            form.reset();
            setIsAdding(false);
            loadBudgets();
        } catch (e) {
            console.error('Failed to add budget:', e);
        }
    };

    const handleEdit = (budget: BudgetStatus) => {
        setEditingId(budget.id);
        setEditAmount(budget.amount.toString());
        setEditThreshold(budget.alertThreshold.toString());
    };

    const handleSaveEdit = async (id: number) => {
        try {
            await fetch(`/api/budgets/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: Number(editAmount),
                    alertThreshold: Number(editThreshold)
                })
            });
            setEditingId(null);
            loadBudgets();
        } catch (e) {
            console.error('Failed to update budget:', e);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this budget?')) return;
        try {
            await fetch(`/api/budgets/${id}`, { method: 'DELETE' });
            loadBudgets();
        } catch (e) {
            console.error('Failed to delete budget:', e);
        }
    };

    const getProgressBarColor = (status: string) => {
        switch (status) {
            case 'good': return 'bg-green-500';
            case 'warning': return 'bg-yellow-500';
            case 'over': return 'bg-red-500';
            default: return 'bg-blue-500';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'good': return <HiCheckCircle className="w-5 h-5 text-green-500" />;
            case 'warning': return <HiExclamation className="w-5 h-5 text-yellow-500" />;
            case 'over': return <HiExclamation className="w-5 h-5 text-red-500" />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Budget Management</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Set budgets and track your spending to stay on target
                    </p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {isAdding ? 'Cancel' : 'Add Budget'}
                </button>
            </div>

            {/* Alerts Section */}
            {budgetStatus && budgetStatus.alerts.length > 0 && (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
                    <div className="flex items-start">
                        <HiExclamation className="w-6 h-6 text-red-500 mr-3 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-red-900 mb-2">Budget Alerts</h3>
                            <div className="space-y-2">
                                {budgetStatus.alerts.map(alert => (
                                    <div key={alert.id} className="text-sm">
                                        <span className="font-medium text-red-800">{alert.category}</span>
                                        <span className="text-red-700">
                                            {' '}— {alert.isOverBudget ? 'Over budget' : 'Near limit'} at{' '}
                                            <strong>{alert.percentage}%</strong> (₹{alert.spent} / ₹{alert.amount})
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Budget Form */}
            {isAdding && (
                <form onSubmit={handleAdd} className="bg-white p-6 rounded-lg shadow-sm space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                name="category"
                                required
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                {CATEGORY_OPTIONS.map(cat => (
                                    <option key={cat} value={cat}>{cat === 'overall' ? 'Overall Budget' : cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Budget Amount (₹)</label>
                            <input
                                type="number"
                                name="amount"
                                step="0.01"
                                required
                                min="0"
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                            <select
                                name="period"
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Alert Threshold (%)</label>
                            <input
                                type="number"
                                name="alertThreshold"
                                defaultValue="80"
                                min="1"
                                max="100"
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Get alerted when spending reaches this %</p>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Create Budget
                        </button>
                    </div>
                </form>
            )}

            {/* Budget Status Cards */}
            {budgetStatus && budgetStatus.budgets.length > 0 ? (
                <div className="grid gap-4">
                    {budgetStatus.budgets.map(budget => (
                        <div
                            key={budget.id}
                            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    {getStatusIcon(budget.status)}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {budget.category === 'overall' ? 'Overall Budget' : budget.category}
                                        </h3>
                                        <p className="text-sm text-gray-500 capitalize">{budget.period}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(budget)}
                                        className="text-blue-600 hover:text-blue-800 p-2"
                                        title="Edit budget"
                                    >
                                        <HiPencil className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(budget.id)}
                                        className="text-red-600 hover:text-red-800 p-2"
                                        title="Delete budget"
                                    >
                                        <HiTrash className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {editingId === budget.id ? (
                                <div className="space-y-3 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Budget Amount (₹)</label>
                                        <input
                                            type="number"
                                            value={editAmount}
                                            onChange={e => setEditAmount(e.target.value)}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Alert Threshold (%)</label>
                                        <input
                                            type="number"
                                            value={editThreshold}
                                            onChange={e => setEditThreshold(e.target.value)}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleSaveEdit(budget.id)}
                                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Budget</p>
                                            <p className="text-xl font-bold text-gray-900">₹{budget.amount.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Spent</p>
                                            <p className="text-xl font-bold text-blue-600">₹{budget.spent.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Remaining</p>
                                            <p className={`text-xl font-bold ${budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                ₹{budget.remaining.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Progress</span>
                                            <span className={`font-semibold ${budget.status === 'over' ? 'text-red-600' :
                                                    budget.status === 'warning' ? 'text-yellow-600' :
                                                        'text-green-600'
                                                }`}>
                                                {budget.percentage}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(budget.status)}`}
                                                style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                                            />
                                        </div>
                                        {budget.percentage >= budget.alertThreshold && (
                                            <p className="text-xs text-gray-500">
                                                Alert threshold: {budget.alertThreshold}%
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white p-12 rounded-lg shadow-sm text-center">
                    <div className="text-gray-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No budgets set</h3>
                    <p className="text-gray-500 mb-4">Create your first budget to start tracking your spending</p>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Create Budget
                    </button>
                </div>
            )}
        </div>
    );
}
