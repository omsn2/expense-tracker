export async function fetchJSON(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export type Expense = { id: number; amount: number; category: string; note?: string | null; date: string };
export type Todo = { id: number; title: string; done: boolean; createdAt: string };

export const getExpenses = () => fetchJSON('/api/expenses') as Promise<Expense[]>;
export const createExpense = (payload: { amount: number; category?: string; note?: string; date?: string }) =>
  fetchJSON('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }) as Promise<Expense>;

export const getTodos = () => fetchJSON('/api/todos') as Promise<Todo[]>;
export const createTodo = (payload: { title: string }) =>
  fetchJSON('/api/todos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }) as Promise<Todo>;

export const updateTodo = (id: number, payload: Partial<{ done: boolean; title: string }>) =>
  fetchJSON(`/api/todos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }) as Promise<Todo>;

export const getSummary = () => fetchJSON('/api/summary/today');
