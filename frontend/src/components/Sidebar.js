import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { BarChart3, ShoppingCart, Wrench, Package, LogOut, Settings, HelpCircle, ChevronDown, ChevronRight, Building2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const Sidebar = ({ user, onLogout }) => {
  const location = useLocation();
  const [selectedBranch, setSelectedBranch] = useState('Kumarapalayam');
  const [isSalesOpen, setIsSalesOpen] = useState(true);

  const branches = [
    'Kumarapalayam',
    'Kavindapadi',
    'Ammapettai',
    'Anthiyur',
    'Bhavani'
  ];

  useEffect(() => {
    const savedBranch = localStorage.getItem('selectedBranch');
    if (savedBranch) {
      setSelectedBranch(savedBranch);
    }
  }, []);

  const isActive = (path) => location.pathname === path;

  const handleBranchChange = (branch) => {
    setSelectedBranch(branch);
    localStorage.setItem('selectedBranch', branch);
    window.dispatchEvent(new CustomEvent('branchChanged', { detail: branch }));
  };

  return (
    <div className="w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 min-h-screen flex flex-col" data-testid="sidebar">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Dharani TVS</h2>
        <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">AI Business Manager</p>
      </div>

      {/* User Info */}
      <div className="mx-4 mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100" data-testid="user-info">
        <div className="flex items-center gap-3">
          {user?.picture ? (
            <img 
              src={user.picture} 
              alt={user.name} 
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-600 truncate">{user?.email || ''}</p>
          </div>
        </div>
      </div>

      {/* Branch Selector */}
      <div className="mx-4 mt-4">
        <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Branch</label>
        <Select value={selectedBranch} onValueChange={handleBranchChange}>
          <SelectTrigger className="bg-white text-gray-900 border-gray-300" data-testid="branch-selector">
            <SelectValue className="text-gray-900" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {branches.map(branch => (
              <SelectItem 
                key={branch} 
                value={branch}
                className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100 cursor-pointer"
              >
                {branch}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {/* Main Dashboard - Above Branch Selection */}
        <Link to="/global" data-testid="nav-global">
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 mb-4 ${
            isActive('/global')
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 hover:from-indigo-100 hover:to-purple-100'
          }`}>
            <Building2 className="w-5 h-5" />
            <span className="text-sm font-semibold">Main Dashboard</span>
          </div>
        </Link>

        {/* Show branch-specific menu only when NOT on Main Dashboard */}
        {!isActive('/global') && (
          <>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
              Branch: {selectedBranch}
            </div>
            
            {/* Sales with Submenu */}
            <div>
              <button
                onClick={() => setIsSalesOpen(!isSalesOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white transition-all duration-200"
                data-testid="nav-sales"
              >
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5" />
                  <span className="text-sm font-medium">Sales</span>
            </div>
            {isSalesOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          
          {isSalesOpen && (
            <div className="ml-4 mt-1 space-y-1">
              <Link to="/dashboard">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isActive('/dashboard')
                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                  <BarChart3 className="w-4 h-4" />
                  Dashboard
                </div>
              </Link>
              <Link to="/enquiries">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isActive('/enquiries')
                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                  Enquiries
                </div>
              </Link>
              <Link to="/bookings">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isActive('/bookings')
                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                  Bookings
                </div>
              </Link>
              <Link to="/">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isActive('/')
                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                  Sold
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Service */}
        <Link to="/service" data-testid="nav-service">
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
            isActive('/service')
              ? 'bg-indigo-100 text-indigo-700 font-medium'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }`}>
            <Wrench className="w-5 h-5" />
            <span className="text-sm">Service</span>
          </div>
        </Link>

        {/* Inventory */}
        <Link to="/inventory" data-testid="nav-inventory">
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
            isActive('/inventory')
              ? 'bg-indigo-100 text-indigo-700 font-medium'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }`}>
            <Package className="w-5 h-5" />
            <span className="text-sm">Inventory</span>
          </div>
        </Link>
          </>
        )}

        <div className="pt-6 mt-6 border-t border-gray-200">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
            Support
          </div>
          <Link to="/settings" data-testid="nav-settings">
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
              isActive('/settings')
                ? 'bg-indigo-100 text-indigo-700 font-medium'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}>
              <Settings className="w-5 h-5" />
              <span className="text-sm">Settings</span>
            </div>
          </Link>
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 w-full">
            <HelpCircle className="w-5 h-5" />
            <span className="text-sm">Help & Support</span>
          </button>
        </div>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <Button
          onClick={onLogout}
          variant="ghost"
          className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
          data-testid="logout-button"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
