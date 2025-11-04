import React, { useEffect, useState } from 'react';
import { getExpenses, getTodos, createExpense, createTodo, updateTodo, getSummary, Expense, Todo } from './api';

export default function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const load = async () => {
    try {
      setExpenses(await getExpenses());
      setTodos(await getTodos());
      setSummary(await getSummary());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  const addExpense = async () => {
    const amount = Number((document.getElementById('expense-amount') as HTMLInputElement).value);
    const category = (document.getElementById('expense-category') as HTMLInputElement).value || 'uncategorized';
    const date = (document.getElementById('expense-date') as HTMLInputElement).value || new Date().toISOString();
    const note = (document.getElementById('expense-note') as HTMLInputElement).value || '';
    await createExpense({ amount, category, date, note });
    await load();
  };

  const addTodo = async () => {
    const title = (document.getElementById('todo-title') as HTMLInputElement).value;
    if (!title) return;
    await createTodo({ title });
    (document.getElementById('todo-title') as HTMLInputElement).value = '';
    await load();
  };

  const toggleTodo = async (id: number, done: boolean) => {
    await updateTodo(id, { done });
    await load();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Expense & Todo Tracker</h1>

      <section className="mb-6 p-4 border rounded">
        <h2 className="font-semibold mb-2">Add Expense</h2>
        <div className="flex gap-2 flex-wrap">
          <input id="expense-amount" className="border p-1" type="number" placeholder="amount" />
          <input id="expense-category" className="border p-1" placeholder="category" />
          <input id="expense-date" className="border p-1" type="date" />
          <input id="expense-note" className="border p-1" placeholder="note" />
          <button onClick={addExpense} className="bg-blue-600 text-white px-3 py-1 rounded">Add</button>
        </div>
        <div className="mt-3">
          {expenses.length === 0 ? <div>No expenses yet</div> : expenses.map(e => (
            <div key={e.id} className="text-sm">${e.amount} — {e.category} — {new Date(e.date).toLocaleString()} {e.note ? ' — ' + e.note : ''}</div>
          ))}
        </div>
      </section>

      <section className="mb-6 p-4 border rounded">
        <h2 className="font-semibold mb-2">Todos</h2>
        <div className="flex gap-2 mb-2">
          <input id="todo-title" className="border p-1 flex-1" placeholder="todo title" />
          <button onClick={addTodo} className="bg-green-600 text-white px-3 py-1 rounded">Add</button>
        </div>
        <div>
          {todos.map(t => (
            <div key={t.id} className="flex items-center gap-2">
              <input type="checkbox" checked={t.done} onChange={e => toggleTodo(t.id, e.target.checked)} />
              <span className={t.done ? 'line-through text-gray-500' : ''}>{t.title}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="p-4 border rounded">
        <h2 className="font-semibold mb-2">Today Summary</h2>
        <pre className="text-sm">{summary ? JSON.stringify(summary, null, 2) : 'loading...'}</pre>
      </section>
    </div>
  );
}
