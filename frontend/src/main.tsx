import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { HiHome, HiCreditCard, HiCheckCircle, HiCash, HiRefresh, HiTrendingUp, HiCog } from 'react-icons/hi';
import clsx from 'clsx';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Todos from './pages/Todos';
import Budgets from './pages/Budgets';
import RecurringExpenses from './pages/RecurringExpenses';
import Income from './pages/Income';
import Settings from './pages/Settings';
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

function MobileNavLink({ to, icon: Icon, children, onClick }: { to: string; icon: React.ElementType; children: React.ReactNode; onClick: () => void }) {
  const { pathname } = useLocation();
  const isActive = pathname === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={clsx(
        "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-base font-medium",
        isActive
          ? "bg-blue-100 text-blue-700"
          : "text-gray-700 hover:bg-gray-100"
      )}
    >
      <Icon className="w-6 h-6" />
      <span>{children}</span>
    </Link>
  );
}

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Finance Tracker</h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              <NavLink to="/" icon={HiHome}>Dashboard</NavLink>
              <NavLink to="/income" icon={HiTrendingUp}>Income</NavLink>
              <NavLink to="/expenses" icon={HiCreditCard}>Expenses</NavLink>
              <NavLink to="/budgets" icon={HiCash}>Budgets</NavLink>
              <NavLink to="/recurring" icon={HiRefresh}>Recurring</NavLink>
              <NavLink to="/todos" icon={HiCheckCircle}>Todos</NavLink>
              <NavLink to="/settings" icon={HiCog}>Settings</NavLink>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <MobileNavLink to="/" icon={HiHome} onClick={() => setMobileMenuOpen(false)}>Dashboard</MobileNavLink>
              <MobileNavLink to="/income" icon={HiTrendingUp} onClick={() => setMobileMenuOpen(false)}>Income</MobileNavLink>
              <MobileNavLink to="/expenses" icon={HiCreditCard} onClick={() => setMobileMenuOpen(false)}>Expenses</MobileNavLink>
              <MobileNavLink to="/budgets" icon={HiCash} onClick={() => setMobileMenuOpen(false)}>Budgets</MobileNavLink>
              <MobileNavLink to="/recurring" icon={HiRefresh} onClick={() => setMobileMenuOpen(false)}>Recurring</MobileNavLink>
              <MobileNavLink to="/todos" icon={HiCheckCircle} onClick={() => setMobileMenuOpen(false)}>Todos</MobileNavLink>
              <MobileNavLink to="/settings" icon={HiCog} onClick={() => setMobileMenuOpen(false)}>Settings</MobileNavLink>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/income" element={<Income />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/recurring" element={<RecurringExpenses />} />
          <Route path="/todos" element={<Todos />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
