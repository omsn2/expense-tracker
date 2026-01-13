import express, { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';

const prisma = new PrismaClient();

export function createServer(): Express {
  const app = express();
  app.use(express.json());

  // Enable CORS for all origins (for production, you might want to restrict this)
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

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

  // ===== BUDGET ENDPOINTS =====

  // Get all budgets
  app.get('/api/budgets', async (req, res) => {
    const budgets = await prisma.budget.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(budgets);
  });

  // Create budget
  app.post('/api/budgets', async (req, res) => {
    const { category, amount, period, year, month, alertThreshold } = req.body;

    if (!category || typeof category !== 'string') {
      return res.status(400).json({ error: 'category is required' });
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }
    if (period && !['monthly', 'yearly'].includes(period)) {
      return res.status(400).json({ error: 'period must be monthly or yearly' });
    }

    try {
      const budget = await prisma.budget.create({
        data: {
          category,
          amount: Number(amount),
          period: period || 'monthly',
          year: year ? Number(year) : null,
          month: month ? Number(month) : null,
          alertThreshold: alertThreshold ? Number(alertThreshold) : 80
        }
      });
      res.status(201).json(budget);
    } catch (e: any) {
      if (e.code === 'P2002') {
        return res.status(409).json({ error: 'Budget already exists for this category and period' });
      }
      res.status(500).json({ error: 'Failed to create budget' });
    }
  });

  // Update budget
  app.put('/api/budgets/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { amount, alertThreshold } = req.body;

    try {
      const budget = await prisma.budget.update({
        where: { id },
        data: {
          ...(typeof amount === 'number' ? { amount: Number(amount) } : {}),
          ...(typeof alertThreshold === 'number' ? { alertThreshold: Number(alertThreshold) } : {})
        }
      });
      res.json(budget);
    } catch (e) {
      res.status(404).json({ error: 'Budget not found' });
    }
  });

  // Delete budget
  app.delete('/api/budgets/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
      await prisma.budget.delete({ where: { id } });
      res.json({ success: true });
    } catch (e) {
      res.status(404).json({ error: 'Budget not found' });
    }
  });

  // Get budget status (spending vs budget with alerts)
  app.get('/api/budgets/status', async (req, res) => {
    const { year, month } = req.query;
    const currentYear = year ? Number(year) : new Date().getFullYear();
    const currentMonth = month ? Number(month) : new Date().getMonth() + 1;

    // Get all budgets (both specific and recurring)
    const budgets = await prisma.budget.findMany({
      where: {
        OR: [
          { year: currentYear, month: currentMonth },
          { year: currentYear, month: null, period: 'yearly' },
          { year: null, month: currentMonth, period: 'monthly' },
          { year: null, month: null, period: 'monthly' }
        ]
      }
    });

    // Calculate date ranges
    const monthStart = new Date(currentYear, currentMonth - 1, 1);
    const monthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    // Get expenses for the period
    const [monthExpenses, yearExpenses] = await Promise.all([
      prisma.expense.findMany({ where: { date: { gte: monthStart, lte: monthEnd } } }),
      prisma.expense.findMany({ where: { date: { gte: yearStart, lte: yearEnd } } })
    ]);

    // Calculate spending by category
    const calculateSpending = (expenses: any[]) => {
      const byCategory: Record<string, number> = {};
      let total = 0;
      expenses.forEach(e => {
        byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
        total += e.amount;
      });
      return { byCategory, total };
    };

    const monthSpending = calculateSpending(monthExpenses);
    const yearSpending = calculateSpending(yearExpenses);

    // Build status for each budget
    const budgetStatus = budgets.map(budget => {
      const isYearly = budget.period === 'yearly';
      const spending = isYearly ? yearSpending : monthSpending;
      const spent = budget.category === 'overall'
        ? spending.total
        : (spending.byCategory[budget.category] || 0);

      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      const remaining = budget.amount - spent;
      const isOverBudget = spent > budget.amount;
      const isNearLimit = percentage >= budget.alertThreshold && !isOverBudget;

      return {
        ...budget,
        spent: Number(spent.toFixed(2)),
        remaining: Number(remaining.toFixed(2)),
        percentage: Number(percentage.toFixed(1)),
        isOverBudget,
        isNearLimit,
        status: isOverBudget ? 'over' : isNearLimit ? 'warning' : 'good'
      };
    });

    res.json({
      year: currentYear,
      month: currentMonth,
      budgets: budgetStatus,
      totalSpent: Number(monthSpending.total.toFixed(2)),
      alerts: budgetStatus.filter(b => b.isOverBudget || b.isNearLimit)
    });
  });

  // ===== RECURRING EXPENSE ENDPOINTS =====

  // Helper function to calculate next occurrence
  const calculateNextOccurrence = (recurring: any, fromDate?: Date): Date => {
    const base = fromDate || new Date(recurring.lastGenerated || recurring.startDate);
    const next = new Date(base);

    switch (recurring.frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        if (recurring.dayOfMonth) {
          next.setMonth(next.getMonth() + 1);
          next.setDate(Math.min(recurring.dayOfMonth, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
        } else {
          next.setMonth(next.getMonth() + 1);
        }
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }

    return next;
  };

  // Get all recurring expenses
  app.get('/api/recurring-expenses', async (req, res) => {
    const recurring = await prisma.recurringExpense.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(recurring);
  });

  // Create recurring expense
  app.post('/api/recurring-expenses', async (req, res) => {
    const { name, amount, category, frequency, dayOfMonth, dayOfWeek, startDate, endDate, autoGenerate, note } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required' });
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }
    if (!['daily', 'weekly', 'monthly', 'yearly'].includes(frequency)) {
      return res.status(400).json({ error: 'frequency must be daily, weekly, monthly, or yearly' });
    }

    const start = startDate ? new Date(startDate) : new Date();
    const nextOccurrence = calculateNextOccurrence({ frequency, dayOfMonth, startDate: start }, start);

    try {
      const recurring = await prisma.recurringExpense.create({
        data: {
          name,
          amount: Number(amount),
          category: category || 'uncategorized',
          frequency,
          dayOfMonth: dayOfMonth ? Number(dayOfMonth) : null,
          dayOfWeek: dayOfWeek ? Number(dayOfWeek) : null,
          startDate: start,
          endDate: endDate ? new Date(endDate) : null,
          nextOccurrence,
          autoGenerate: autoGenerate !== false,
          note: note || null
        }
      });
      res.status(201).json(recurring);
    } catch (e) {
      res.status(500).json({ error: 'Failed to create recurring expense' });
    }
  });

  // Update recurring expense
  app.put('/api/recurring-expenses/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { name, amount, isActive, autoGenerate, note } = req.body;

    try {
      const recurring = await prisma.recurringExpense.update({
        where: { id },
        data: {
          ...(typeof name === 'string' ? { name } : {}),
          ...(typeof amount === 'number' ? { amount: Number(amount) } : {}),
          ...(typeof isActive === 'boolean' ? { isActive } : {}),
          ...(typeof autoGenerate === 'boolean' ? { autoGenerate } : {}),
          ...(note !== undefined ? { note } : {})
        }
      });
      res.json(recurring);
    } catch (e) {
      res.status(404).json({ error: 'Recurring expense not found' });
    }
  });

  // Delete recurring expense
  app.delete('/api/recurring-expenses/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
      await prisma.recurringExpense.delete({ where: { id } });
      res.json({ success: true });
    } catch (e) {
      res.status(404).json({ error: 'Recurring expense not found' });
    }
  });

  // Generate expenses from recurring (manual trigger or can be called by cron)
  app.post('/api/recurring-expenses/generate', async (req, res) => {
    const now = new Date();
    const generated = [];

    try {
      // Get all active recurring expenses that are due
      const recurring = await prisma.recurringExpense.findMany({
        where: {
          isActive: true,
          autoGenerate: true,
          nextOccurrence: { lte: now }
        }
      });

      for (const rec of recurring) {
        // Check if end date has passed
        if (rec.endDate && rec.endDate < now) {
          await prisma.recurringExpense.update({
            where: { id: rec.id },
            data: { isActive: false }
          });
          continue;
        }

        // Create the expense
        const expense = await prisma.expense.create({
          data: {
            amount: rec.amount,
            category: rec.category,
            note: `${rec.note || ''} [Auto-generated from: ${rec.name}]`.trim(),
            date: rec.nextOccurrence
          }
        });

        generated.push({ recurring: rec.name, expense });

        // Update next occurrence
        const nextOccurrence = calculateNextOccurrence(rec, rec.nextOccurrence);
        await prisma.recurringExpense.update({
          where: { id: rec.id },
          data: {
            lastGenerated: now,
            nextOccurrence
          }
        });
      }

      res.json({
        success: true,
        generated: generated.length,
        expenses: generated
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to generate expenses' });
    }
  });

  // Get upcoming recurring expenses (next 30 days)
  app.get('/api/recurring-expenses/upcoming', async (req, res) => {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcoming = await prisma.recurringExpense.findMany({
      where: {
        isActive: true,
        nextOccurrence: {
          gte: now,
          lte: thirtyDaysFromNow
        }
      },
      orderBy: { nextOccurrence: 'asc' }
    });

    res.json(upcoming);
  });

  // ===== INCOME ENDPOINTS =====

  // Get all income
  app.get('/api/income', async (req, res) => {
    const { year, month, limit = '100' } = req.query;
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
    const income = await prisma.income.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limitNum
    });
    res.json(income);
  });

  // Create income
  app.post('/api/income', async (req, res) => {
    const { amount, source, category, note, date } = req.body;
    if (typeof amount !== 'number' || Number.isNaN(amount)) {
      return res.status(400).json({ error: 'amount must be a number' });
    }
    if (!source || typeof source !== 'string') {
      return res.status(400).json({ error: 'source is required' });
    }
    const parsedDate = date ? new Date(date) : new Date();
    const income = await prisma.income.create({
      data: {
        amount: Number(amount),
        source,
        category: category || 'salary',
        note: note || null,
        date: parsedDate
      }
    });
    res.status(201).json(income);
  });

  // Delete income
  app.delete('/api/income/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
      await prisma.income.delete({ where: { id } });
      res.json({ success: true });
    } catch (e) {
      res.status(404).json({ error: 'not found' });
    }
  });

  // Get income statistics
  app.get('/api/income/stats', async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    const [todayIncome, monthIncome] = await Promise.all([
      prisma.income.findMany({
        where: { date: { gte: today, lte: todayEnd } }
      }),
      prisma.income.findMany({
        where: { date: { gte: monthStart, lte: monthEnd } }
      })
    ]);

    const calculateStats = (incomes: any[]) => ({
      total: incomes.reduce((sum, i) => sum + i.amount, 0),
      count: incomes.length,
      byCategory: incomes.reduce((acc: Record<string, number>, i) => {
        acc[i.category] = (acc[i.category] || 0) + i.amount;
        return acc;
      }, {})
    });

    res.json({
      today: calculateStats(todayIncome),
      thisMonth: calculateStats(monthIncome)
    });
  });

  // Get cash flow (income vs expenses with savings)
  app.get('/api/cashflow', async (req, res) => {
    const { year, month } = req.query;
    const currentYear = year ? Number(year) : new Date().getFullYear();
    const currentMonth = month ? Number(month) : new Date().getMonth() + 1;

    const monthStart = new Date(currentYear, currentMonth - 1, 1);
    const monthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    const [income, expenses] = await Promise.all([
      prisma.income.findMany({ where: { date: { gte: monthStart, lte: monthEnd } } }),
      prisma.expense.findMany({ where: { date: { gte: monthStart, lte: monthEnd } } })
    ]);

    const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    // Monthly trend for last 6 months
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const [monthIncome, monthExpenses] = await Promise.all([
        prisma.income.findMany({ where: { date: { gte: start, lte: end } } }),
        prisma.expense.findMany({ where: { date: { gte: start, lte: end } } })
      ]);

      const incomeTotal = monthIncome.reduce((sum, i) => sum + i.amount, 0);
      const expenseTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

      monthlyTrend.push({
        month: format(d, 'MMM yyyy'),
        income: Number(incomeTotal.toFixed(2)),
        expenses: Number(expenseTotal.toFixed(2)),
        savings: Number((incomeTotal - expenseTotal).toFixed(2))
      });
    }

    res.json({
      year: currentYear,
      month: currentMonth,
      totalIncome: Number(totalIncome.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      netSavings: Number(netSavings.toFixed(2)),
      savingsRate: Number(savingsRate.toFixed(1)),
      incomeCount: income.length,
      expenseCount: expenses.length,
      monthlyTrend
    });
  });

  // ===== EXPORT & BACKUP ENDPOINTS =====

  // Export expenses as CSV
  app.get('/api/export/expenses/csv', async (req, res) => {
    try {
      const expenses = await prisma.expense.findMany({ orderBy: { date: 'desc' } });

      const csvData = [
        ['Date', 'Amount', 'Category', 'Note'].join(','),
        ...expenses.map(e => [
          format(new Date(e.date), 'yyyy-MM-dd'),
          e.amount,
          e.category,
          `"${(e.note || '').replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=expenses_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      res.send(csvData);
    } catch (e) {
      res.status(500).json({ error: 'Failed to export expenses' });
    }
  });

  // Export income as CSV
  app.get('/api/export/income/csv', async (req, res) => {
    try {
      const income = await prisma.income.findMany({ orderBy: { date: 'desc' } });

      const csvData = [
        ['Date', 'Amount', 'Source', 'Category', 'Note'].join(','),
        ...income.map(i => [
          format(new Date(i.date), 'yyyy-MM-dd'),
          i.amount,
          `"${i.source.replace(/"/g, '""')}"`,
          i.category,
          `"${(i.note || '').replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=income_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      res.send(csvData);
    } catch (e) {
      res.status(500).json({ error: 'Failed to export income' });
    }
  });

  // Export budgets as CSV
  app.get('/api/export/budgets/csv', async (req, res) => {
    try {
      const budgets = await prisma.budget.findMany({ orderBy: { createdAt: 'desc' } });

      const csvData = [
        ['Category', 'Amount', 'Period', 'Alert Threshold'].join(','),
        ...budgets.map(b => [
          b.category,
          b.amount,
          b.period,
          b.alertThreshold
        ].join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=budgets_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      res.send(csvData);
    } catch (e) {
      res.status(500).json({ error: 'Failed to export budgets' });
    }
  });

  // Full backup (all data as JSON)
  app.get('/api/backup', async (req, res) => {
    try {
      const [expenses, income, budgets, recurring, todos] = await Promise.all([
        prisma.expense.findMany(),
        prisma.income.findMany(),
        prisma.budget.findMany(),
        prisma.recurringExpense.findMany(),
        prisma.todo.findMany()
      ]);

      const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: { expenses, income, budgets, recurring, todos }
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=finance_backup_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`);
      res.json(backup);
    } catch (e) {
      res.status(500).json({ error: 'Failed to create backup' });
    }
  });

  // Restore from backup
  app.post('/api/restore', async (req, res) => {
    try {
      const { data, clearExisting } = req.body;

      if (!data) {
        return res.status(400).json({ error: 'No backup data provided' });
      }

      // Optionally clear existing data
      if (clearExisting) {
        await Promise.all([
          prisma.expense.deleteMany(),
          prisma.income.deleteMany(),
          prisma.budget.deleteMany(),
          prisma.recurringExpense.deleteMany(),
          prisma.todo.deleteMany()
        ]);
      }

      // Restore data
      const results = await Promise.all([
        data.expenses ? prisma.expense.createMany({ data: data.expenses, skipDuplicates: true }) : null,
        data.income ? prisma.income.createMany({ data: data.income, skipDuplicates: true }) : null,
        data.budgets ? prisma.budget.createMany({ data: data.budgets, skipDuplicates: true }) : null,
        data.recurring ? prisma.recurringExpense.createMany({ data: data.recurring, skipDuplicates: true }) : null,
        data.todos ? prisma.todo.createMany({ data: data.todos, skipDuplicates: true }) : null
      ]);

      res.json({
        success: true,
        restored: {
          expenses: results[0]?.count || 0,
          income: results[1]?.count || 0,
          budgets: results[2]?.count || 0,
          recurring: results[3]?.count || 0,
          todos: results[4]?.count || 0
        }
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to restore backup' });
    }
  });

  // Get notification data (for reminders)
  app.get('/api/notifications', async (req, res) => {
    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [budgetAlerts, upcomingRecurring, dueTodos] = await Promise.all([
        // Budget alerts
        prisma.budget.findMany(),
        // Recurring expenses due soon
        prisma.recurringExpense.findMany({
          where: {
            isActive: true,
            nextOccurrence: { lte: tomorrow }
          }
        }),
        // Todos due today or overdue
        prisma.todo.findMany({
          where: {
            done: false,
            dueDate: { lte: now }
          }
        })
      ]);

      // Calculate budget status for alerts
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const expenses = await prisma.expense.findMany({
        where: { date: { gte: monthStart, lte: monthEnd } }
      });

      const notifications = [];

      // Budget notifications
      for (const budget of budgetAlerts) {
        const categoryExpenses = budget.category === 'overall'
          ? expenses
          : expenses.filter(e => e.category === budget.category);

        const spent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
        const percentage = (spent / budget.amount) * 100;

        if (percentage >= budget.alertThreshold) {
          notifications.push({
            type: 'budget',
            title: `Budget Alert: ${budget.category}`,
            message: `${percentage.toFixed(0)}% of budget used (₹${spent.toFixed(2)} / ₹${budget.amount.toFixed(2)})`,
            priority: percentage >= 100 ? 'high' : 'medium',
            data: budget
          });
        }
      }

      // Recurring expense notifications
      for (const rec of upcomingRecurring) {
        notifications.push({
          type: 'recurring',
          title: `Upcoming Bill: ${rec.name}`,
          message: `₹${rec.amount.toFixed(2)} due on ${format(new Date(rec.nextOccurrence), 'MMM d')}`,
          priority: 'medium',
          data: rec
        });
      }

      // Todo notifications
      for (const todo of dueTodos) {
        const isOverdue = todo.dueDate && new Date(todo.dueDate) < now;
        notifications.push({
          type: 'todo',
          title: isOverdue ? `Overdue: ${todo.text}` : `Due Today: ${todo.text}`,
          message: todo.dueDate ? `Due: ${format(new Date(todo.dueDate), 'MMM d, yyyy')}` : 'No due date',
          priority: isOverdue ? 'high' : 'medium',
          data: todo
        });
      }

      res.json({ notifications, count: notifications.length });
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  return app;
}
