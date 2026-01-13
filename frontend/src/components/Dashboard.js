import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Users, DollarSign, Activity, ArrowUpRight, ArrowDownRight, Download, Filter } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = ({ user, onLogout }) => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/overview`);
      setOverview(response.data);
    } catch (error) {
      console.error('Failed to fetch overview:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex bg-gray-50">
        <Sidebar user={user} onLogout={onLogout} />
        <div className="flex-1 p-8">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, change, icon: Icon, color, trend }) => (
    <Card className="p-6 bg-white rounded-xl border border-gray-200 card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>
          <div className="flex items-center gap-1">
            {trend === 'up' ? (
              <ArrowUpRight className="w-4 h-4 text-green-600" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-600" />
            )}
            <span className={`text-sm font-medium ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {change}
            </span>
            <span className="text-sm text-gray-500">vs last period</span>
          </div>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );

  const totalBookings = overview?.branches?.reduce((sum, b) => sum + b.bookings, 0) || 0;
  const totalDeliveries = overview?.branches?.reduce((sum, b) => sum + b.deliveries, 0) || 0;
  const totalRevenue = overview?.branches?.reduce((sum, b) => sum + b.revenue, 0) || 0;

  return (
    <div className="flex bg-gray-50" data-testid="dashboard">
      <Sidebar user={user} onLogout={onLogout} />
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome back, {user.name}! Here's what's happening today.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
              <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Bookings"
              value={totalBookings}
              change="+15.3%"
              icon={Activity}
              color="bg-gradient-to-br from-indigo-500 to-indigo-600"
              trend="up"
              data-testid="bookings-card"
            />
            <StatCard
              title="Deliveries"
              value={totalDeliveries}
              change="+12.5%"
              icon={TrendingUp}
              color="bg-gradient-to-br from-green-500 to-green-600"
              trend="up"
              data-testid="deliveries-card"
            />
            <StatCard
              title="Total Revenue"
              value={`₹${(totalRevenue / 100000).toFixed(1)}L`}
              change="+8.2%"
              icon={DollarSign}
              color="bg-gradient-to-br from-purple-500 to-purple-600"
              trend="up"
              data-testid="revenue-card"
            />
            <StatCard
              title="Pending Items"
              value={(overview?.finance_stats?.pending || 0) + (overview?.service_stats?.pending || 0)}
              change="-3.1%"
              icon={Users}
              color="bg-gradient-to-br from-orange-500 to-orange-600"
              trend="down"
              data-testid="pending-card"
            />
          </div>

          {/* Branch Performance Chart */}
          <Card className="p-6 bg-white rounded-xl border border-gray-200 mb-8" data-testid="branch-performance-chart">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Branch Performance</h2>
                <p className="text-sm text-gray-600">Bookings and deliveries by branch</p>
              </div>
              <Button variant="outline" size="sm">View Details</Button>
            </div>
            {overview?.branches && (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={overview.branches}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis 
                    dataKey="branch_name" 
                    stroke="#9ca3af" 
                    style={{ fontSize: '12px', fontFamily: 'Inter' }}
                  />
                  <YAxis 
                    stroke="#9ca3af" 
                    style={{ fontSize: '12px', fontFamily: 'Inter' }}
                  />
                  <Tooltip
                    contentStyle={{ 
                      background: '#fff', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    labelStyle={{ color: '#111827', fontWeight: 600 }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px', fontFamily: 'Inter' }}
                  />
                  <Bar dataKey="bookings" fill="#6366f1" radius={[8, 8, 0, 0]} name="Bookings" />
                  <Bar dataKey="deliveries" fill="#10b981" radius={[8, 8, 0, 0]} name="Deliveries" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Branch Cards Grid */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Branch Overview</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {overview?.branches?.map((branch) => (
              <Card
                key={branch.branch_id}
                className="p-6 bg-white rounded-xl border border-gray-200 card-hover"
                data-testid={`branch-card-${branch.branch_id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{branch.branch_name}</h3>
                    <p className="text-sm text-gray-600">Branch ID: {branch.branch_id}</p>
                  </div>
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Bookings</span>
                    <span className="text-sm font-semibold text-gray-900">{branch.bookings}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Deliveries</span>
                    <span className="text-sm font-semibold text-gray-900">{branch.deliveries}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">Revenue</span>
                    <span className="text-sm font-semibold text-indigo-600">
                      ₹{(branch.revenue / 100000).toFixed(2)}L
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {overview?.demo_mode && (
            <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-amber-800 text-sm font-medium">
                ⚠️ Demo Mode: Connect your Google Sheets for live data. Make sure the sheet is set to "Anyone with the link can view".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;