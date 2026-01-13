import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { ShoppingCart, Wrench, Package, LogOut, Settings, HelpCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const Sidebar = ({ user, onLogout }) => {
  const location = useLocation();
  const [selectedBranch, setSelectedBranch] = useState('Bhavani');
  const [isSalesOpen, setIsSalesOpen] = useState(true);

  const branches = [
    'Bhavani',
    'Kavindapadi',
    'Anthiyur',
    'Kumarapalayam',
    'Ammapettai'
  ];

  const isActive = (path) => location.pathname === path;

  const handleBranchChange = (branch) => {
    setSelectedBranch(branch);
    // Store in localStorage so it persists across pages
    localStorage.setItem('selectedBranch', branch);
    // Trigger a custom event so other components can react
    window.dispatchEvent(new CustomEvent('branchChanged', { detail: branch }));
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col" data-testid="sidebar">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Dharani TVS</h2>
        <p className="text-sm text-indigo-600 font-medium">Business Manager</p>
      </div>

      {/* User Info */}
      <div className="mx-4 mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100" data-testid="user-info">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-600 capitalize">{user.role.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      {/* Branch Selector */}
      <div className="mx-4 mt-4">
        <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Branch</label>
        <Select value={selectedBranch} onValueChange={handleBranchChange}>
          <SelectTrigger className="bg-white" data-testid="branch-selector">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {branches.map(branch => (
              <SelectItem key={branch} value={branch}>{branch}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
          General
        </div>
        
        {/* Sales with Submenu */}
        <div>
          <button
            onClick={() => setIsSalesOpen(!isSalesOpen)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
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
              <Link to="/enquiries">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isActive('/enquiries')
                    ? 'bg-indigo-50 text-indigo-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}>
                  Enquiries
                </div>
              </Link>
              <Link to="/bookings">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isActive('/bookings')
                    ? 'bg-indigo-50 text-indigo-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}>
                  Bookings
                </div>
              </Link>
              <Link to="/">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isActive('/')
                    ? 'bg-indigo-50 text-indigo-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}>
                  Sales
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Service */}
        <Link to="/service" data-testid="nav-service">
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
            isActive('/service')
              ? 'bg-indigo-50 text-indigo-600 font-medium'
              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
          }`}>
            <Wrench className="w-5 h-5" />
            <span className="text-sm">Service</span>
          </div>
        </Link>

        {/* Inventory */}
        <Link to="/inventory" data-testid="nav-inventory">
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
            isActive('/inventory')
              ? 'bg-indigo-50 text-indigo-600 font-medium'
              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
          }`}>
            <Package className="w-5 h-5" />
            <span className="text-sm">Inventory</span>
          </div>
        </Link>

        <div className="pt-6 mt-6 border-t border-gray-200">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
            Support
          </div>
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 w-full">
            <Settings className="w-5 h-5" />
            <span className="text-sm">Settings</span>
          </button>
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 w-full">
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