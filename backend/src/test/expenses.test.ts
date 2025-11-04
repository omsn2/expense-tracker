import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createServer } from '../server/app';

const app = createServer();

const execAsync = promisify(exec);
const prisma = new PrismaClient();

describe('Expenses API', () => {
  // global setup handles DB reset/migrations

  beforeEach(async () => {
    // Clear expenses before each test
    await prisma.expense.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a new expense', async () => {
    const expense = {
      amount: 50.99,
      category: 'Food',
      note: 'Lunch',
      date: new Date().toISOString()
    };

    const response = await request(app)
      .post('/api/expenses')
      .send(expense)
      .expect(201);

    expect(response.body).toMatchObject({
      amount: expense.amount,
      category: expense.category,
      note: expense.note
    });
    expect(response.body.id).toBeDefined();
  });

  it('should get all expenses', async () => {
    // Create test expenses
    const expenses = [
      { amount: 10, category: 'Food', date: new Date() },
      { amount: 20, category: 'Transport', date: new Date() }
    ];

    await Promise.all(
      expenses.map(exp => 
        prisma.expense.create({ data: exp })
      )
    );

    const response = await request(app)
      .get('/api/expenses')
      .expect(200);

    expect(response.body).toHaveLength(2);
    expect(response.body[0].amount).toBeDefined();
    expect(response.body[0].category).toBeDefined();
  });

  it('should delete an expense', async () => {
    // Create a test expense
    const expense = await prisma.expense.create({
      data: {
        amount: 30,
        category: 'Test',
        date: new Date()
      }
    });

    await request(app)
      .delete(`/api/expenses/${expense.id}`)
      .expect(200);

    // Verify expense is deleted
    const deleted = await prisma.expense.findUnique({
      where: { id: expense.id }
    });
    expect(deleted).toBeNull();
  });

  it('should get expense statistics', async () => {
    // Create test expenses for today
    const today = new Date();
    const expenses = [
      { amount: 10, category: 'Food', date: today },
      { amount: 20, category: 'Food', date: today },
      { amount: 30, category: 'Transport', date: today }
    ];

    await Promise.all(
      expenses.map(exp => 
        prisma.expense.create({ data: exp })
      )
    );

    const response = await request(app)
      .get('/api/expenses/stats')
      .expect(200);

    expect(response.body.today).toBeDefined();
    expect(response.body.today.total).toBe(60);
    expect(response.body.today.count).toBe(3);
    expect(response.body.today.byCategory.Food).toBe(30);
    expect(response.body.today.byCategory.Transport).toBe(30);
  });
});