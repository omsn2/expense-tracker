import { useCallback, useEffect, useState } from 'react';
import { HiTrash } from 'react-icons/hi';
import { format } from 'date-fns';

type Todo = {
  id: number;
  title: string;
  done: boolean;
  createdAt: string;
  category: 'Professional' | 'Personal';
  priority: 'High' | 'Medium' | 'Low';
};

export default function Todos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [category, setCategory] = useState<'Professional' | 'Personal'>('Professional');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [dateFilter, setDateFilter] = useState<'today' | 'thisMonth' | 'past'>('today');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTodos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetch('/api/todos').then(r => r.json());
      setTodos(data);
    } catch (e) {
      setError('Failed to load todos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTodo, category, priority })
      });
      setNewTodo('');
      await loadTodos();
    } catch (e) {
      setError('Failed to add todo');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: number, done: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done })
      });
      if (!res.ok) throw new Error('Failed to update');
      setTodos(prev => prev.map(t => t.id === id ? { ...t, done } : t));
    } catch (e) {
      setError('Failed to update todo');
      await loadTodos();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this todo?')) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setTodos(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      setError('Failed to delete todo');
      await loadTodos();
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (t: Todo) => {
    setEditingId(t.id);
    setEditingText(t.title);
  };

  const saveEdit = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingText })
      });
      if (!res.ok) throw new Error('Save failed');
      setTodos(prev => prev.map(t => t.id === id ? { ...t, title: editingText } : t));
      setEditingId(null);
      setEditingText('');
    } catch (e) {
      setError('Failed to save todo');
      await loadTodos();
    } finally {
      setLoading(false);
    }
  };

  const filteredTodos = todos.filter(t => {
    const matchesFilter = filter === 'all' || (filter === 'active' && !t.done) || (filter === 'completed' && t.done);
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchesDate = dateFilter === 'today' ? format(new Date(t.createdAt), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') :
      dateFilter === 'thisMonth' ? new Date(t.createdAt).getMonth() === new Date().getMonth() :
      new Date(t.createdAt) < new Date();
    return matchesFilter && matchesSearch && matchesDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Todos</h2>
        <div className="text-sm text-gray-500 flex items-center gap-4">
          <div>{filteredTodos.filter(t => !t.done).length} active</div>
          <div>{filteredTodos.filter(t => t.done).length} completed</div>
          <div>
            <select value={filter} onChange={e => setFilter(e.target.value as any)} className="rounded-md border-gray-300">
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="text-red-500">{error}</div>}
      {loading && <div className="text-blue-500">Loading...</div>}

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newTodo}
          onChange={e => setNewTodo(e.target.value)}
          placeholder="Add a new todo..."
          className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        <select value={category} onChange={e => setCategory(e.target.value as any)} className="rounded-md border-gray-300">
          <option value="Professional">Professional</option>
          <option value="Personal">Personal</option>
        </select>
        <select value={priority} onChange={e => setPriority(e.target.value as any)} className="rounded-md border-gray-300">
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add Todo
        </button>
      </form>

      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search todos..."
          className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        <select value={dateFilter} onChange={e => setDateFilter(e.target.value as any)} className="rounded-md border-gray-300">
          <option value="today">Today</option>
          <option value="thisMonth">This Month</option>
          <option value="past">Past</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm divide-y">
        {filteredTodos.map(todo => (
          <div key={todo.id} className="p-4 flex items-center gap-4">
            <input
              type="checkbox"
              checked={todo.done}
              onChange={e => handleToggle(todo.id, e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div className="flex-1">
              {editingId === todo.id ? (
                <div className="flex gap-2">
                  <input value={editingText} onChange={e => setEditingText(e.target.value)} className="flex-1 rounded-md border-gray-300 p-1" />
                  <button onClick={() => saveEdit(todo.id)} className="text-sm text-green-600">Save</button>
                  <button onClick={() => setEditingId(null)} className="text-sm text-gray-500">Cancel</button>
                </div>
              ) : (
                <div className={todo.done ? 'line-through text-gray-500' : ''}>
                  {todo.title} <span className="text-xs text-gray-400">({todo.category}, {todo.priority})</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => startEdit(todo)} className="text-sm text-gray-600">Edit</button>
              <button
                onClick={() => handleDelete(todo.id)}
                className="text-red-600 hover:text-red-900"
              >
                <HiTrash className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}