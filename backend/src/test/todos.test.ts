import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createServer } from '../server/app';

const execAsync = promisify(exec);
const prisma = new PrismaClient();
const app = createServer();

describe('Todos API', () => {
  // global setup handles DB reset/migrations

  beforeEach(async () => {
    // Clear todos before each test
    await prisma.todo.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a new todo', async () => {
    const todo = { title: 'Test todo' };
    const response = await request(app)
      .post('/api/todos')
      .send(todo)
      .expect(201);

    expect(response.body).toMatchObject({
      title: todo.title,
      done: false
    });
    expect(response.body.id).toBeDefined();
  });

  it('should get all todos', async () => {
    // Create test todos
    const todos = [
      { title: 'Todo 1' },
      { title: 'Todo 2' }
    ];

    await Promise.all(
      todos.map(todo => prisma.todo.create({ data: todo }))
    );

    const response = await request(app)
      .get('/api/todos')
      .expect(200);

    expect(response.body).toHaveLength(2);
    expect(response.body[0].title).toBeDefined();
    expect(response.body[0].done).toBeDefined();
  });

  it('should update a todo', async () => {
    // Create a test todo
    const todo = await prisma.todo.create({
      data: { title: 'Original title' }
    });

    const response = await request(app)
      .put(`/api/todos/${todo.id}`)
      .send({ done: true, title: 'Updated title' })
      .expect(200);

    expect(response.body).toMatchObject({
      id: todo.id,
      title: 'Updated title',
      done: true
    });

    // Verify in database
    const updated = await prisma.todo.findUnique({
      where: { id: todo.id }
    });
    expect(updated).toMatchObject({
      title: 'Updated title',
      done: true
    });
  });

  it('should delete a todo', async () => {
    // Create a test todo
    const todo = await prisma.todo.create({
      data: { title: 'To be deleted' }
    });

    await request(app)
      .delete(`/api/todos/${todo.id}`)
      .expect(200);

    // Verify todo is deleted
    const deleted = await prisma.todo.findUnique({
      where: { id: todo.id }
    });
    expect(deleted).toBeNull();
  });
});