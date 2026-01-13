import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { ShoppingCart, Wrench, Package, LogOut, Settings, HelpCircle, Check, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

const Sidebar = ({ user, onLogout }) => {
  const location = useLocation();
  const [selectedBranches, setSelectedBranches] = useState(['All']);
  const [isOpen, setIsOpen] = useState(false);

  const branches = [
    'All',
    'Bhavani',
    'Kavindapadi',
    'Anthiyur',
    'Kumarapalayam',
    'Ammapettai'
  ];

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Sales', icon: ShoppingCart, section: 'main' },
    { path: '/service', label: 'Service', icon: Wrench, section: 'main' },
    { path: '/inventory', label: 'Inventory', icon: Package, section: 'main' }
  ];

  const toggleBranch = (branch) => {
    if (branch === 'All') {
      setSelectedBranches(['All']);
    } else {
      const newSelection = selectedBranches.filter(b => b !== 'All');
      if (selectedBranches.includes(branch)) {
        const filtered = newSelection.filter(b => b !== branch);
        setSelectedBranches(filtered.length === 0 ? ['All'] : filtered);
      } else {
        setSelectedBranches([...newSelection, branch]);
      }
    }
  };

  const displayText = selectedBranches.includes('All') 
    ? 'All Branches' 
    : selectedBranches.length === 1 
    ? selectedBranches[0]
    : `${selectedBranches.length} Branches`;

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col" data-testid="sidebar">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Dharani TVS</h2>
        <p className="text-sm text-indigo-600 font-medium">Business AI Manager</p>
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
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-between bg-white hover:bg-gray-50 border-gray-200"
              data-testid="branch-selector"
            >
              <span className="text-sm font-medium text-gray-700">{displayText}</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3" align="start">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Select Branches</p>
              {branches.map((branch) => (
                <button
                  key={branch}
                  onClick={() => toggleBranch(branch)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  data-testid={`branch-option-${branch.toLowerCase()}`}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    selectedBranches.includes(branch) 
                      ? 'bg-indigo-600 border-indigo-600' 
                      : 'border-gray-300'
                  }`}>
                    {selectedBranches.includes(branch) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="text-sm text-gray-700">{branch}</span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
          General
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-indigo-50 text-indigo-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </div>
            </Link>
          );
        })}

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