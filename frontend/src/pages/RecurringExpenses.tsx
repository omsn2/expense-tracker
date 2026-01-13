import { useCallback, useEffect, useState } from 'react';
import { HiTrash, HiPencil, HiPlay, HiPause, HiRefresh, HiClock } from 'react-icons/hi';
import { format } from 'date-fns';

type RecurringExpense = {
    id: number;
    name: string;
    amount: number;
    category: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    dayOfMonth: number | null;
    dayOfWeek: number | null;
    startDate: string;
    endDate: string | null;
    lastGenerated: string | null;
    nextOccurrence: string;
    isActive: boolean;
    autoGenerate: boolean;
    note: string | null;
    createdAt: string;
};

export default function RecurringExpenses() {
    const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
    const [upcoming, setUpcoming] = useState<RecurringExpense[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editAmount, setEditAmount] = useState('');
    const [generating, setGenerating] = useState(false);

    const CATEGORY_OPTIONS = ['Travel', 'Food', 'Groceries', 'Utilities', 'Entertainment', 'Health', 'Subscriptions', 'Rent', 'Other'];
    const FREQUENCY_OPTIONS = [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'yearly', label: 'Yearly' }
    ];

    const TEMPLATES = [
        { name: 'Netflix', amount: 199, category: 'Subscriptions', frequency: 'monthly' },
        { name: 'Spotify', amount: 119, category: 'Subscriptions', frequency: 'monthly' },
        { name: 'Rent', amount: 15000, category: 'Rent', frequency: 'monthly' },
        { name: 'Electricity Bill', amount: 2000, category: 'Utilities', frequency: 'monthly' },
        { name: 'Internet', amount: 999, category: 'Utilities', frequency: 'monthly' },
    ];

    const loadRecurring = useCallback(async () => {
        try {
            const [recurringData, upcomingData] = await Promise.all([
                fetch('/api/recurring-expenses').then(r => r.json()),
                fetch('/api/recurring-expenses/upcoming').then(r => r.json())
            ]);
            setRecurring(recurringData);
            setUpcoming(upcomingData);
        } catch (e) {
            console.error('Failed to load recurring expenses:', e);
        }
    }, []);

    useEffect(() => {
        loadRecurring();
    }, [loadRecurring]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const name = form.expenseName.value;
        const amount = Number(form.amount.value);
        const category = form.category.value;
        const frequency = form.frequency.value;
        const dayOfMonth = frequency === 'monthly' ? Number(form.dayOfMonth?.value) || null : null;
        const startDate = form.startDate.value || new Date().toISOString();
        const note = form.note.value || null;

        try {
            await fetch('/api/recurring-expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, amount, category, frequency, dayOfMonth, startDate, note })
            });
            form.reset();
            setIsAdding(false);
            loadRecurring();
        } catch (e) {
            console.error('Failed to add recurring expense:', e);
        }
    };

    const handleTemplate = (template: typeof TEMPLATES[0]) => {
        const form = document.querySelector('form') as HTMLFormElement;
        if (form) {
            (form.expenseName as HTMLInputElement).value = template.name;
            (form.amount as HTMLInputElement).value = template.amount.toString();
            (form.category as HTMLSelectElement).value = template.category;
            (form.frequency as HTMLSelectElement).value = template.frequency;
        }
    };

    const handleEdit = (rec: RecurringExpense) => {
        setEditingId(rec.id);
        setEditName(rec.name);
        setEditAmount(rec.amount.toString());
    };

    const handleSaveEdit = async (id: number) => {
        try {
            await fetch(`/api/recurring-expenses/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName, amount: Number(editAmount) })
            });
            setEditingId(null);
            loadRecurring();
        } catch (e) {
            console.error('Failed to update recurring expense:', e);
        }
    };

    const handleToggleActive = async (id: number, isActive: boolean) => {
        try {
            await fetch(`/api/recurring-expenses/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !isActive })
            });
            loadRecurring();
        } catch (e) {
            console.error('Failed to toggle recurring expense:', e);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this recurring expense?')) return;
        try {
            await fetch(`/api/recurring-expenses/${id}`, { method: 'DELETE' });
            loadRecurring();
        } catch (e) {
            console.error('Failed to delete recurring expense:', e);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const response = await fetch('/api/recurring-expenses/generate', { method: 'POST' });
            const result = await response.json();
            alert(`Generated ${result.generated} expense(s) from recurring transactions!`);
            loadRecurring();
        } catch (e) {
            console.error('Failed to generate expenses:', e);
            alert('Failed to generate expenses');
        } finally {
            setGenerating(false);
        }
    };

    const getFrequencyBadge = (frequency: string) => {
        const colors = {
            daily: 'bg-purple-100 text-purple-800',
            weekly: 'bg-blue-100 text-blue-800',
            monthly: 'bg-green-100 text-green-800',
            yearly: 'bg-orange-100 text-orange-800'
        };
        return colors[frequency as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Recurring Expenses</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Automate your monthly bills and subscriptions
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <HiRefresh className={generating ? 'animate-spin' : ''} />
                        {generating ? 'Generating...' : 'Generate Due'}
                    </button>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        {isAdding ? 'Cancel' : 'Add Recurring'}
                    </button>
                </div>
            </div>

            {/* Upcoming Section */}
            {upcoming.length > 0 && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                    <div className="flex items-start">
                        <HiClock className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-blue-900 mb-2">📅 Upcoming (Next 30 Days)</h3>
                            <div className="space-y-1">
                                {upcoming.slice(0, 5).map(rec => (
                                    <div key={rec.id} className="text-sm text-blue-800">
                                        <strong>{rec.name}</strong> — ₹{rec.amount.toFixed(2)} on{' '}
                                        {format(new Date(rec.nextOccurrence), 'MMM d, yyyy')}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Form */}
            {isAdding && (
                <form onSubmit={handleAdd} className="bg-white p-6 rounded-lg shadow-sm space-y-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Add Recurring Expense</h3>
                        <div className="flex gap-2 flex-wrap">
                            {TEMPLATES.map(template => (
                                <button
                                    key={template.name}
                                    type="button"
                                    onClick={() => handleTemplate(template)}
                                    className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors"
                                >
                                    {template.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                            <input
                                type="text"
                                name="expenseName"
                                required
                                placeholder="e.g., Netflix Subscription"
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                            <input
                                type="number"
                                name="amount"
                                step="0.01"
                                required
                                min="0"
                                placeholder="199"
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                name="category"
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                {CATEGORY_OPTIONS.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Frequency *</label>
                            <select
                                name="frequency"
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                onChange={(e) => {
                                    const dayField = document.getElementById('dayOfMonthField');
                                    if (dayField) {
                                        dayField.style.display = e.target.value === 'monthly' ? 'block' : 'none';
                                    }
                                }}
                            >
                                {FREQUENCY_OPTIONS.map(freq => (
                                    <option key={freq.value} value={freq.value}>{freq.label}</option>
                                ))}
                            </select>
                        </div>
                        <div id="dayOfMonthField" style={{ display: 'none' }}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Day of Month</label>
                            <input
                                type="number"
                                name="dayOfMonth"
                                min="1"
                                max="31"
                                placeholder="1-31"
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                name="startDate"
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                            <input
                                type="text"
                                name="note"
                                placeholder="Optional note"
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Create Recurring Expense
                        </button>
                    </div>
                </form>
            )}

            {/* Recurring Expenses List */}
            {recurring.length > 0 ? (
                <div className="grid gap-4">
                    {recurring.map(rec => (
                        <div
                            key={rec.id}
                            className={`bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow ${!rec.isActive ? 'opacity-60' : ''
                                }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    {editingId === rec.id ? (
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                className="w-full rounded-lg border-gray-300 shadow-sm"
                                            />
                                            <input
                                                type="number"
                                                value={editAmount}
                                                onChange={e => setEditAmount(e.target.value)}
                                                className="w-full rounded-lg border-gray-300 shadow-sm"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleSaveEdit(rec.id)}
                                                    className="bg-green-600 text-white px-4 py-1 rounded text-sm"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="bg-gray-300 text-gray-700 px-4 py-1 rounded text-sm"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-semibold text-gray-900">{rec.name}</h3>
                                                <span className={`text-xs px-2 py-1 rounded-full ${getFrequencyBadge(rec.frequency)}`}>
                                                    {rec.frequency}
                                                </span>
                                                {!rec.isActive && (
                                                    <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-600">
                                                        Paused
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500">{rec.category}</p>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <button
                                        onClick={() => handleToggleActive(rec.id, rec.isActive)}
                                        className={`p-2 rounded ${rec.isActive ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                                        title={rec.isActive ? 'Pause' : 'Resume'}
                                    >
                                        {rec.isActive ? <HiPause className="w-5 h-5" /> : <HiPlay className="w-5 h-5" />}
                                    </button>
                                    <button
                                        onClick={() => handleEdit(rec)}
                                        className="text-blue-600 hover:bg-blue-50 p-2 rounded"
                                        title="Edit"
                                    >
                                        <HiPencil className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(rec.id)}
                                        className="text-red-600 hover:bg-red-50 p-2 rounded"
                                        title="Delete"
                                    >
                                        <HiTrash className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {editingId !== rec.id && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">Amount</p>
                                        <p className="font-semibold text-gray-900">₹{rec.amount.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Next Due</p>
                                        <p className="font-semibold text-gray-900">
                                            {format(new Date(rec.nextOccurrence), 'MMM d, yyyy')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Last Generated</p>
                                        <p className="font-semibold text-gray-900">
                                            {rec.lastGenerated ? format(new Date(rec.lastGenerated), 'MMM d') : 'Never'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Auto-Generate</p>
                                        <p className="font-semibold text-gray-900">{rec.autoGenerate ? '✅ Yes' : '❌ No'}</p>
                                    </div>
                                </div>
                            )}

                            {rec.note && editingId !== rec.id && (
                                <p className="text-sm text-gray-600 mt-3 italic">Note: {rec.note}</p>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white p-12 rounded-lg shadow-sm text-center">
                    <div className="text-gray-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No recurring expenses yet</h3>
                    <p className="text-gray-500 mb-4">Set up automatic tracking for your bills and subscriptions</p>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Add Your First Recurring Expense
                    </button>
                </div>
            )}
        </div>
    );
}
