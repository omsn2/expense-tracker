async function fetchJSON(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

async function loadExpenses() {
  const list = document.getElementById('expenses');
  const expenses = await fetchJSON('/api/expenses');
  list.innerHTML = expenses.map(e => `<div>₹${e.amount} — ${e.category} — ${new Date(e.date).toLocaleString()} ${e.note ? ' — ' + e.note : ''}</div>`).join('');
}

async function loadTodos() {
  const list = document.getElementById('todos');
  const todos = await fetchJSON('/api/todos');
  list.innerHTML = todos.map(t => `<div><input type="checkbox" data-id="${t.id}" ${t.done ? 'checked' : ''}/> ${t.title}</div>`).join('');
  document.querySelectorAll('#todos input[type=checkbox]').forEach(cb => cb.addEventListener('change', async (ev) => {
    const id = ev.target.dataset.id;
    await fetchJSON(`/api/todos/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ done: ev.target.checked }) });
    await loadSummary();
  }));
}

async function loadSummary() {
  const s = await fetchJSON('/api/summary/today');
  document.getElementById('summary').textContent = JSON.stringify(s, null, 2);
}

document.getElementById('expense-add').addEventListener('click', async () => {
  const amount = Number(document.getElementById('expense-amount').value);
  const category = document.getElementById('expense-category').value;
  const date = document.getElementById('expense-date').value || new Date().toISOString();
  const note = document.getElementById('expense-note').value;
  await fetchJSON('/api/expenses', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ amount, category, date, note }) });
  await loadExpenses();
  await loadSummary();
});

document.getElementById('todo-add').addEventListener('click', async () => {
  const title = document.getElementById('todo-title').value;
  await fetchJSON('/api/todos', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ title }) });
  document.getElementById('todo-title').value = '';
  await loadTodos();
  await loadSummary();
});

// initial load
loadExpenses().catch(e => console.error(e));
loadTodos().catch(e => console.error(e));
loadSummary().catch(e => console.error(e));
