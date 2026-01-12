import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';

const Sidebar = ({ user, onLogout }) => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
    { path: '/chat', label: 'AI Chat', icon: '🤖' },
    { path: '/commitments', label: 'Commitments', icon: '✅' },
    { path: '/plans', label: 'Plans', icon: '📅' }
  ];

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-700 min-h-screen p-6" data-testid="sidebar">
      {/* Logo */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white">Dharani TVS</h2>
        <p className="text-blue-400 text-sm">AI Manager</p>
      </div>

      {/* User Info */}
      <div className="mb-8 p-4 bg-slate-800 rounded-lg" data-testid="user-info">
        <p className="text-white font-semibold">{user.name}</p>
        <p className="text-gray-400 text-sm capitalize">{user.role.replace('_', ' ')}</p>
      </div>

      {/* Navigation */}
      <nav className="space-y-2 mb-8">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            data-testid={`nav-${item.label.toLowerCase()}`}
          >
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <Button
        onClick={onLogout}
        variant="ghost"
        className="w-full text-red-400 hover:bg-red-500/10 hover:text-red-300"
        data-testid="logout-button"
      >
        🚪 Logout
      </Button>
    </div>
  );
};

export default Sidebar;