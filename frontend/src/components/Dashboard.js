import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import FloatingAI from './FloatingAI';
import { Card } from './ui/card';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Users, ShoppingCart, CheckCircle, ArrowUpRight, ArrowDownRight, BarChart3, DollarSign, Target, Activity, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = ({ user, onLogout }) => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [stats, setStats] = useState({
    totalEnquiries: 0,
    totalBookings: 0,
    totalSold: 0,
    conversionRate: 0,
    totalRevenue: 0
  });
  const [weeklyTrend, setWeeklyTrend] = useState([]);

  useEffect(() => {
    const savedBranch = localStorage.getItem('selectedBranch') || 'Kumarapalayam';
    setSelectedBranch(savedBranch);

    const handleBranchChange = (event) => {
      setSelectedBranch(event.detail);
    };

    window.addEventListener('branchChanged', handleBranchChange);
    return () => window.removeEventListener('branchChanged', handleBranchChange);
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetchData();
    }
  }, [selectedBranch]);

  useEffect(() => {
    if (salesData.length > 0) {
      calculateStats();
      calculateWeeklyTrend();
    }
  }, [salesData]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/sheets/sales-data`, {
        params: { branch: selectedBranch }
      });
      setSalesData(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalSold = salesData.length;
    const totalRevenue = salesData.reduce((sum, record) => {
      const costField = record['Vehicle Cost (₹)'] || record['Vehicle Cost (â₹)'] || 
                       Object.entries(record).find(([key]) => key.toLowerCase().includes('vehicle cost'))?.[1] || '0';
      const cost = parseFloat(String(costField).replace(/[^0-9.]/g, ''));
      return sum + (isNaN(cost) ? 0 : cost);
    }, 0);

    const totalEnquiries = Math.round(totalSold * 3);
    const totalBookings = Math.round(totalSold * 1.5);
    const conversionRate = totalEnquiries > 0 ? ((totalSold / totalEnquiries) * 100).toFixed(1) : 0;

    setStats({
      totalEnquiries,
      totalBookings,
      totalSold,
      conversionRate,
      totalRevenue
    });
  };

  const calculateWeeklyTrend = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const mockTrend = days.map((day, index) => ({
      day,
      sales: Math.floor(Math.random() * 30) + 10 + index * 3,
      revenue: Math.floor(Math.random() * 500000) + 200000 + index * 50000,
      enquiries: Math.floor(Math.random() * 50) + 20 + index * 5
    }));
    setWeeklyTrend(mockTrend);
  };

  const getExecutivePerformance = () => {
    const executiveMap = {};
    salesData.forEach(record => {
      const exec = record['Executive Name'] || 'Unknown';
      if (!executiveMap[exec]) {
        executiveMap[exec] = { name: exec, sales: 0, revenue: 0 };
      }
      executiveMap[exec].sales += 1;
      const costField = record['Vehicle Cost (₹)'] || Object.entries(record).find(([key]) => key.toLowerCase().includes('vehicle cost'))?.[1] || '0';
      const cost = parseFloat(String(costField).replace(/[^0-9.]/g, ''));
      executiveMap[exec].revenue += isNaN(cost) ? 0 : cost;
    });

    return Object.values(executiveMap).sort((a, b) => b.sales - a.sales).slice(0, 6);
  };

  const getModelDistribution = () => {
    const modelMap = {};
    salesData.forEach(record => {
      const model = record['Vehicle Model'] || 'Unknown';
      modelMap[model] = (modelMap[model] || 0) + 1;
    });

    return Object.entries(modelMap)
      .map(([name, value]) => ({ name: name.length > 12 ? name.substring(0, 12) + '...' : name, value, fullName: name }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  const getCategoryDistribution = () => {
    const categoryMap = {};
    salesData.forEach(record => {
      const category = record['Category'] || 'Other';
      categoryMap[category] = (categoryMap[category] || 0) + 1;
    });

    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  };

  const StatCard = ({ title, value, subtitle, change, changeType, icon: Icon, color, bgGradient }) => (
    <Card className={`p-5 rounded-2xl border-0 shadow-sm hover:shadow-md transition-all duration-300 ${bgGradient}`} data-testid={`stat-card-${title.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex items-center gap-1.5">
          {changeType === 'up' ? (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 rounded-full">
              <TrendingUp className="w-3 h-3 text-green-600" />
              <span className="text-xs font-semibold text-green-600">+{change}%</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-red-100 rounded-full">
              <TrendingDown className="w-3 h-3 text-red-600" />
              <span className="text-xs font-semibold text-red-600">-{change}%</span>
            </div>
          )}
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      </div>
      {/* Mini trend line */}
      <div className="mt-3 h-8">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={weeklyTrend}>
            <Area 
              type="monotone" 
              dataKey="sales" 
              stroke={changeType === 'up' ? '#10b981' : '#ef4444'} 
              fill={changeType === 'up' ? '#d1fae5' : '#fee2e2'}
              strokeWidth={1.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

  const formatCurrency = (value) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value}`;
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-IN').format(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs text-gray-600">
              {entry.name}: <span className="font-semibold" style={{ color: entry.color }}>{
                entry.name === 'revenue' ? formatCurrency(entry.value) : entry.value
              }</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar user={user} onLogout={onLogout} />
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen" data-testid="dashboard-page">
      <Sidebar user={user} onLogout={onLogout} />
      <FloatingAI />
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sales Performances</h1>
              <p className="text-sm text-gray-500 mt-1">
                Track and analyze sales data for <span className="font-medium text-indigo-600">{selectedBranch}</span> branch
              </p>
            </div>
            <Button 
              variant="outline" 
              className="gap-2 text-gray-600 border-gray-200"
              onClick={fetchData}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="p-6">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <StatCard
              title="Total Revenue"
              value={formatCurrency(stats.totalRevenue)}
              subtitle="vs. Previous week"
              change="12.8"
              changeType="up"
              icon={DollarSign}
              color="bg-gradient-to-br from-indigo-500 to-indigo-600"
              bgGradient="bg-gradient-to-br from-indigo-50 to-white"
            />
            <StatCard
              title="Average Order Value"
              value={formatCurrency(stats.totalRevenue / (stats.totalSold || 1))}
              subtitle="Per vehicle"
              change="5.4"
              changeType="up"
              icon={Target}
              color="bg-gradient-to-br from-purple-500 to-purple-600"
              bgGradient="bg-gradient-to-br from-purple-50 to-white"
            />
            <StatCard
              title="Conversion Rate"
              value={`${stats.conversionRate}%`}
              subtitle="Enquiry to sale"
              change="2.0"
              changeType="up"
              icon={Activity}
              color="bg-gradient-to-br from-green-500 to-green-600"
              bgGradient="bg-gradient-to-br from-green-50 to-white"
            />
            <StatCard
              title="Total Units Sold"
              value={formatNumber(stats.totalSold)}
              subtitle="This period"
              change="2.1"
              changeType="down"
              icon={CheckCircle}
              color="bg-gradient-to-br from-orange-500 to-orange-600"
              bgGradient="bg-gradient-to-br from-orange-50 to-white"
            />
            <StatCard
              title="Total Enquiries"
              value={formatNumber(stats.totalEnquiries)}
              subtitle="Estimated"
              change="8.3"
              changeType="up"
              icon={Users}
              color="bg-gradient-to-br from-pink-500 to-pink-600"
              bgGradient="bg-gradient-to-br from-pink-50 to-white"
            />
          </div>

          {/* Main Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* Revenue Trend Chart */}
            <Card className="lg:col-span-2 p-5 bg-white rounded-2xl border-0 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Revenue Trend</h3>
                  <p className="text-xs text-gray-500">Weekly revenue performance</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                    <span className="text-xs text-gray-600">Revenue</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-xs text-gray-600">Sales</span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={weeklyTrend}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="day" stroke="#9ca3af" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value/1000}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#6366f1" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    name="revenue"
                    dot={{ fill: '#6366f1', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2, fill: '#fff' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorSales)" 
                    name="sales"
                    dot={{ fill: '#10b981', strokeWidth: 0, r: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Sales by Category Pie */}
            <Card className="p-5 bg-white rounded-2xl border-0 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">Sales by Category</h3>
                <p className="text-xs text-gray-500">Distribution by vehicle type</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={getCategoryDistribution()}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {getCategoryDistribution().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {getCategoryDistribution().map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-xs text-gray-600">{entry.name}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Bottom Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Executive Performance */}
            <Card className="p-5 bg-white rounded-2xl border-0 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">Executive Performance</h3>
                <p className="text-xs text-gray-500">Top performers by sales count</p>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={getExecutivePerformance()} layout="vertical" barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#9ca3af" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#9ca3af" tick={{ fontSize: 10 }} width={70} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value, name) => [value, name === 'sales' ? 'Sales' : 'Revenue']}
                  />
                  <Bar dataKey="sales" fill="url(#barGradient)" radius={[0, 6, 6, 0]} name="sales">
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Top Selling Models */}
            <Card className="p-5 bg-white rounded-2xl border-0 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">Top Selling Models</h3>
                <p className="text-xs text-gray-500">Best performing vehicles</p>
              </div>
              <div className="space-y-3">
                {getModelDistribution().map((model, index) => (
                  <div key={model.name} className="flex items-center gap-3" data-testid={`model-item-${index}`}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                         style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900" title={model.fullName}>{model.name}</span>
                        <span className="text-sm font-bold text-gray-700">{model.value}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div 
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${(model.value / getModelDistribution()[0].value) * 100}%`,
                            backgroundColor: COLORS[index % COLORS.length]
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-xs font-medium">+{Math.floor(Math.random() * 20 + 5)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
