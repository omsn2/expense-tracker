import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Dashboard', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    // Mock successful API responses
    mockFetch.mockImplementation((url) => {
      const data = {
        '/api/expenses': [],
        '/api/todos': [],
        '/api/expenses/stats': {
          today: { total: 0, count: 0, byCategory: {} },
          thisMonth: { total: 0, count: 0, byCategory: {} }
        }
      };
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(data[url as keyof typeof data])
      });
    });
  });

  it('renders the dashboard header', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('displays stats cards', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    
    expect(await screen.findByText('Today')).toBeInTheDocument();
    expect(await screen.findByText('This month')).toBeInTheDocument();
    expect(await screen.findByText('Todos')).toBeInTheDocument();
  });

  it('makes API calls on mount', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    
    expect(mockFetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/expenses/));
    expect(mockFetch).toHaveBeenCalledWith('/api/todos');
    expect(mockFetch).toHaveBeenCalledWith('/api/expenses/stats');
  });
});