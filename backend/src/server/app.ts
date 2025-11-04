import express, { Express } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function createServer(): Express {
  const app = express();
  app.use(express.json());

  // Get expenses (with optional year/month filtering)
  app.get('/api/expenses', async (req, res) => {
  const { year, month, limit = '50' } = req.query;
  const where: any = {};

  if (typeof year === 'string' && !Number.isNaN(Number(year))) {
    const yearNum = Number(year);
    if (typeof month === 'string' && !Number.isNaN(Number(month))) {
      const monthNum = Number(month);
      const start = new Date(yearNum, monthNum - 1, 1, 0, 0, 0, 0);
      const end = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
      where.date = { gte: start, lte: end };
    } else {
      const start = new Date(yearNum, 0, 1, 0, 0, 0, 0);
      const end = new Date(yearNum, 11, 31, 23, 59, 59, 999);
      where.date = { gte: start, lte: end };
    }
  }

  const limitNum = Number(limit);
  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: 'desc' },
    take: limitNum
  });
  res.json(expenses);
});

  // Create expense
  app.post('/api/expenses', async (req, res) => {
    const { amount, category, note, date } = req.body;
    if (typeof amount !== 'number' || Number.isNaN(amount)) {
      return res.status(400).json({ error: 'amount must be a number' });
    }
    const parsedDate = date ? new Date(date) : new Date();
    const expense = await prisma.expense.create({
      data: {
        amount: Number(amount),
        category: category || 'uncategorized',
        note: note || null,
        date: parsedDate
      }
    });
    res.status(201).json(expense);
  });

  // Delete expense
  app.delete('/api/expenses/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
      await prisma.expense.delete({ where: { id } });
      res.json({ success: true });
    } catch (e) {
      res.status(404).json({ error: 'not found' });
    }
  });

  // Get expense statistics
  app.get('/api/expenses/stats', async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    const [todayExpenses, monthExpenses] = await Promise.all([
      prisma.expense.findMany({
        where: { date: { gte: today, lte: todayEnd } }
      }),
      prisma.expense.findMany({
        where: { date: { gte: monthStart, lte: monthEnd } }
      })
    ]);

    const calculateStats = (expenses: any[]) => ({
      total: expenses.reduce((sum, e) => sum + e.amount, 0),
      count: expenses.length,
      byCategory: expenses.reduce((acc: Record<string, number>, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      }, {})
    });

    res.json({
      today: calculateStats(todayExpenses),
      thisMonth: calculateStats(monthExpenses)
    });
  });

  // Get all todos
  app.get('/api/todos', async (req, res) => {
    const todos = await prisma.todo.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(todos);
  });

  // Create todo
  app.post('/api/todos', async (req, res) => {
    const { title } = req.body;
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'title is required' });
    }
    const todo = await prisma.todo.create({ data: { title } });
    res.status(201).json(todo);
  });

  // Update todo
  app.put('/api/todos/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { done, title } = req.body;
    try {
      const todo = await prisma.todo.update({
        where: { id },
        data: {
          ...(typeof done === 'boolean' ? { done } : {}),
          ...(typeof title === 'string' ? { title } : {})
        }
      });
      res.json(todo);
    } catch (e) {
      res.status(404).json({ error: 'not found' });
    }
  });

  // Delete todo
  app.delete('/api/todos/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
      await prisma.todo.delete({ where: { id } });
      res.json({ success: true });
    } catch (e) {
      res.status(404).json({ error: 'not found' });
    }
  });

  // Get today's summary
  app.get('/api/summary/today', async (req, res) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const expenses = await prisma.expense.findMany({ where: { date: { gte: start, lte: end } } });
    const todos = await prisma.todo.findMany({ where: { done: false } });
    const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

    res.json({
      date: start.toISOString().slice(0, 10),
      totalExpenses: total,
      expenses,
      pendingTodos: todos.length
    });
  });

  return app;
}
