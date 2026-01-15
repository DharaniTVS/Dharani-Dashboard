import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { BarChart3, ShoppingCart, Wrench, Package, LogOut, Settings, Building2, Menu, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const Sidebar = ({ user, onLogout }) => {
  const location = useLocation();
  const [selectedBranch, setSelectedBranch] = useState('Kumarapalayam');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  const handleBranchChange = (branch) => {
    setSelectedBranch(branch);
    localStorage.setItem('selectedBranch', branch);
    window.dispatchEvent(new CustomEvent('branchChanged', { detail: branch }));
  };

  const isMainDashboard = location.pathname === '/global';

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">Dharani TVS</h2>
          <p className="text-xs lg:text-sm text-indigo-600 dark:text-indigo-400 font-medium">AI Business Manager</p>
        </div>
        {/* Close button for mobile */}
        <button 
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          onClick={() => setIsMobileOpen(false)}
          style={{ cursor: 'pointer' }}
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* User Info */}
      <div className="mx-3 lg:mx-4 mt-3 lg:mt-4 p-3 lg:p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100" data-testid="user-info">
        <div className="flex items-center gap-2 lg:gap-3">
          {user?.picture ? (
            <img 
              src={user.picture} 
              alt={user.name} 
              className="w-8 h-8 lg:w-10 lg:h-10 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <p className="text-xs lg:text-sm font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-600 truncate">{user?.email || ''}</p>
          </div>
        </div>
      </div>

      {/* Branch Selector - Hide on Main Dashboard */}
      {!isMainDashboard && (
        <div className="mx-3 lg:mx-4 mt-3 lg:mt-4" data-testid="branch-selector">
          <label className="block text-xs font-medium text-gray-500 mb-1.5 px-1">Select Branch</label>
          <Select value={selectedBranch} onValueChange={handleBranchChange}>
            <SelectTrigger className="w-full bg-white border-gray-200 text-gray-900 h-9">
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent className="bg-white z-[100]">
              {branches.map(branch => (
                <SelectItem 
                  key={branch} 
                  value={branch}
                  className="text-gray-900 hover:bg-indigo-50 focus:bg-indigo-100 focus:text-gray-900 cursor-pointer data-[highlighted]:bg-indigo-50 data-[highlighted]:text-gray-900"
                >
                  {branch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 lg:px-4 py-4 space-y-1 overflow-y-auto">
        {/* Main Dashboard */}
        <Link to="/global" data-testid="nav-global">
          <div className={`flex items-center gap-2 lg:gap-3 px-3 py-2 lg:py-2.5 rounded-lg transition-all duration-200 ${
            isActive('/global')
              ? 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          }`}>
            <Building2 className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="text-sm">Main Dashboard</span>
          </div>
        </Link>

        {/* Sales Dashboard */}
        <Link to="/dashboard" data-testid="nav-dashboard">
          <div className={`flex items-center gap-2 lg:gap-3 px-3 py-2 lg:py-2.5 rounded-lg transition-all duration-200 ${
            isActive('/dashboard')
              ? 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          }`}>
            <BarChart3 className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="text-sm">Sales Dashboard</span>
          </div>
        </Link>

        {/* Sales Data - Enquiries, Bookings, Sold */}
        <Link to="/enquiries" data-testid="nav-enquiries">
          <div className={`flex items-center gap-2 lg:gap-3 px-3 py-2 lg:py-2.5 rounded-lg transition-all duration-200 ${
            isActive('/enquiries')
              ? 'bg-indigo-100 text-indigo-700 font-medium'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }`}>
            <ShoppingCart className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="text-sm">Enquiries</span>
          </div>
        </Link>

        <Link to="/bookings" data-testid="nav-bookings">
          <div className={`flex items-center gap-2 lg:gap-3 px-3 py-2 lg:py-2.5 rounded-lg transition-all duration-200 ${
            isActive('/bookings')
              ? 'bg-indigo-100 text-indigo-700 font-medium'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }`}>
            <ShoppingCart className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="text-sm">Bookings</span>
          </div>
        </Link>

        <Link to="/" data-testid="nav-sold">
          <div className={`flex items-center gap-2 lg:gap-3 px-3 py-2 lg:py-2.5 rounded-lg transition-all duration-200 ${
            isActive('/')
              ? 'bg-indigo-100 text-indigo-700 font-medium'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }`}>
            <ShoppingCart className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="text-sm">Sold</span>
          </div>
        </Link>

        {/* Service */}
        <Link to="/service" data-testid="nav-service">
          <div className={`flex items-center gap-2 lg:gap-3 px-3 py-2 lg:py-2.5 rounded-lg transition-all duration-200 ${
            isActive('/service')
              ? 'bg-indigo-100 text-indigo-700 font-medium'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }`}>
            <Wrench className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="text-sm">Service</span>
          </div>
        </Link>

        {/* Inventory */}
        <Link to="/inventory" data-testid="nav-inventory">
          <div className={`flex items-center gap-2 lg:gap-3 px-3 py-2 lg:py-2.5 rounded-lg transition-all duration-200 ${
            isActive('/inventory')
              ? 'bg-indigo-100 text-indigo-700 font-medium'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }`}>
            <Package className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="text-sm">Inventory</span>
          </div>
        </Link>

        <div className="pt-4 lg:pt-6 mt-4 lg:mt-6 border-t border-gray-200">
          <Link to="/settings" data-testid="nav-settings">
            <div className={`flex items-center gap-2 lg:gap-3 px-3 py-2 lg:py-2.5 rounded-lg transition-all duration-200 ${
              isActive('/settings')
                ? 'bg-indigo-100 text-indigo-700 font-medium'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}>
              <Settings className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="text-sm">Settings</span>
            </div>
          </Link>
        </div>
      </nav>

      {/* Logout */}
      <div className="p-3 lg:p-4 border-t border-gray-200 dark:border-slate-700">
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2 text-gray-700 hover:text-red-600 hover:border-red-200 hover:bg-red-50 text-sm"
          onClick={onLogout}
          data-testid="logout-button"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header with Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Dharani TVS</h2>
          <p className="text-xs text-indigo-600 font-medium">AI Business Manager</p>
        </div>
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-lg"
          style={{ cursor: 'pointer' }}
          data-testid="mobile-menu-button"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed top-0 left-0 h-full w-72 bg-white z-50 transform transition-transform duration-300 ease-in-out ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          <SidebarContent />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 min-h-screen flex-col" data-testid="sidebar">
        <SidebarContent />
      </div>
    </>
  );
};

export default Sidebar;
