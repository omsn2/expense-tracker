import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { HiHome, HiCreditCard, HiCheckCircle } from 'react-icons/hi';
import clsx from 'clsx';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Todos from './pages/Todos';
import './styles/index.css';

function NavLink({ to, icon: Icon, children }: { to: string; icon: React.ElementType; children: React.ReactNode }) {
  const { pathname } = useLocation();
  const isActive = pathname === to;
  
  return (
    <Link 
      to={to} 
      className={clsx(
        "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
        isActive 
          ? "bg-blue-100 text-blue-700" 
          : "text-gray-600 hover:bg-gray-100"
      )}
    >
      <Icon className="w-5 h-5" />
      <span>{children}</span>
    </Link>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">Finance Tracker</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <NavLink to="/" icon={HiHome}>Dashboard</NavLink>
                <NavLink to="/expenses" icon={HiCreditCard}>Expenses</NavLink>
                <NavLink to="/todos" icon={HiCheckCircle}>Todos</NavLink>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/todos" element={<Todos />} />
        </Routes>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
