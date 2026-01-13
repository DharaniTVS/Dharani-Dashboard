import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import FloatingAI from './FloatingAI';
import { Card } from './ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, ShoppingCart, CheckCircle, ArrowUpRight, ArrowDownRight, BarChart3 } from 'lucide-react';

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
      const cost = parseFloat(String(record['Vehicle Cost (₹)'] || '0').replace(/[^0-9.]/g, ''));
      return sum + (isNaN(cost) ? 0 : cost);
    }, 0);

    // For demo: assume enquiries = sold * 3, bookings = sold * 1.5
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

  const getExecutivePerformance = () => {
    const executiveMap = {};
    salesData.forEach(record => {
      const exec = record['Executive Name'] || 'Unknown';
      if (!executiveMap[exec]) {
        executiveMap[exec] = { name: exec, sales: 0, revenue: 0 };
      }
      executiveMap[exec].sales += 1;
      const cost = parseFloat(String(record['Vehicle Cost (₹)'] || '0').replace(/[^0-9.]/g, ''));
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
      .map(([name, value]) => ({ name: name.length > 15 ? name.substring(0, 15) + '...' : name, value, fullName: name }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  };

  const getCategoryDistribution = () => {
    const categoryMap = {};
    salesData.forEach(record => {
      const category = record['Category'] || 'Other';
      categoryMap[category] = (categoryMap[category] || 0) + 1;
    });

    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  };

  const getPaymentDistribution = () => {
    const paymentMap = { Cash: 0, HP: 0 };
    salesData.forEach(record => {
      const payment = record['Cash/HP'] || 'Other';
      if (payment === 'Cash') paymentMap.Cash += 1;
      else if (payment === 'HP') paymentMap.HP += 1;
    });

    return [
      { name: 'Cash', value: paymentMap.Cash },
      { name: 'Finance (HP)', value: paymentMap.HP }
    ];
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
    <Card className="p-6 bg-white rounded-xl border border-gray-200 card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

  const formatCurrency = (value) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value}`;
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
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard - {selectedBranch}</h1>
              <p className="text-sm text-gray-600 mt-1">
                Performance analytics and insights for {selectedBranch} branch
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <StatCard
              title="Total Enquiries"
              value={stats.totalEnquiries}
              subtitle="Estimated enquiries"
              icon={Users}
              color="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <StatCard
              title="Total Bookings"
              value={stats.totalBookings}
              subtitle="Confirmed bookings"
              icon={ShoppingCart}
              color="bg-gradient-to-br from-purple-500 to-purple-600"
            />
            <StatCard
              title="Total Sold"
              value={stats.totalSold}
              subtitle="Delivered vehicles"
              icon={CheckCircle}
              color="bg-gradient-to-br from-green-500 to-green-600"
            />
            <StatCard
              title="Conversion Rate"
              value={`${stats.conversionRate}%`}
              subtitle="Enquiry to sold"
              icon={TrendingUp}
              color="bg-gradient-to-br from-orange-500 to-orange-600"
            />
            <StatCard
              title="Total Revenue"
              value={formatCurrency(stats.totalRevenue)}
              subtitle="From sales"
              icon={ArrowUpRight}
              color="bg-gradient-to-br from-indigo-500 to-indigo-600"
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Executive Performance */}
            <Card className="p-6 bg-white rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Executive Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getExecutivePerformance()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '11px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                    formatter={(value, name) => [name === 'revenue' ? formatCurrency(value) : value, name === 'revenue' ? 'Revenue' : 'Sales']}
                  />
                  <Legend />
                  <Bar dataKey="sales" fill="#6366f1" name="Sales" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Model Distribution */}
            <Card className="p-6 bg-white rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Top Selling Models</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getModelDistribution()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#9ca3af" style={{ fontSize: '11px' }} />
                  <YAxis dataKey="name" type="category" stroke="#9ca3af" style={{ fontSize: '10px' }} width={100} />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                    formatter={(value, name, props) => [value, props.payload.fullName]}
                  />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution */}
            <Card className="p-6 bg-white rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Sales by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getCategoryDistribution()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getCategoryDistribution().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Payment Distribution */}
            <Card className="p-6 bg-white rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Method Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getPaymentDistribution()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#6366f1" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
