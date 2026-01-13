import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import FloatingAI from './FloatingAI';
import { Card } from './ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, ShoppingCart, CheckCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = ({ user, onLogout }) => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState('Bhavani');
  const [stats, setStats] = useState({
    totalEnquiries: 0,
    totalBookings: 0,
    totalSold: 0,
    conversionRate: 0
  });

  useEffect(() => {
    fetchData();
    
    // Listen for branch changes
    const handleBranchChange = (event) => {
      setSelectedBranch(event.detail);
    };
    
    window.addEventListener('branchChanged', handleBranchChange);
    
    const savedBranch = localStorage.getItem('selectedBranch');
    if (savedBranch) {
      setSelectedBranch(savedBranch);
    }
    
    return () => {
      window.removeEventListener('branchChanged', handleBranchChange);
    };
  }, []);

  useEffect(() => {
    if (salesData.length > 0) {
      calculateStats();
    }
  }, [salesData, selectedBranch]);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API}/sheets/sales-data`);
      setSalesData(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    let filtered = salesData;
    
    // Filter by selected branch
    if (selectedBranch && selectedBranch !== 'All') {
      filtered = salesData.filter(record => record['Location'] === selectedBranch);
    }

    const totalEnquiries = filtered.length;
    const totalBookings = filtered.filter(r => r['Booking Status'] === 'Done' || r['Delivery Status'] === 'Done').length;
    const totalSold = filtered.filter(r => r['Delivery Status'] === 'Done').length;
    const conversionRate = totalEnquiries > 0 ? ((totalSold / totalEnquiries) * 100).toFixed(1) : 0;

    setStats({
      totalEnquiries,
      totalBookings,
      totalSold,
      conversionRate
    });
  };

  const getExecutivePerformance = () => {
    let filtered = salesData;
    if (selectedBranch && selectedBranch !== 'All') {
      filtered = salesData.filter(record => record['Location'] === selectedBranch);
    }

    const executiveMap = {};
    filtered.forEach(record => {
      const exec = record['Executive Name'] || 'Unknown';
      if (!executiveMap[exec]) {
        executiveMap[exec] = { name: exec, enquiries: 0, sold: 0 };
      }
      executiveMap[exec].enquiries += 1;
      if (record['Delivery Status'] === 'Done') {
        executiveMap[exec].sold += 1;
      }
    });

    return Object.values(executiveMap).sort((a, b) => b.sold - a.sold).slice(0, 5);
  };

  const getModelDistribution = () => {
    let filtered = salesData;
    if (selectedBranch && selectedBranch !== 'All') {
      filtered = salesData.filter(record => record['Location'] === selectedBranch);
    }

    const modelMap = {};
    filtered.forEach(record => {
      const model = record['Vehicle Model'] || 'Unknown';
      modelMap[model] = (modelMap[model] || 0) + 1;
    });

    return Object.entries(modelMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  const getEnquiryTypeDistribution = () => {
    let filtered = salesData;
    if (selectedBranch && selectedBranch !== 'All') {
      filtered = salesData.filter(record => record['Location'] === selectedBranch);
    }

    const typeMap = {};
    filtered.forEach(record => {
      const type = record['Enquiry Type'] || 'General';
      typeMap[type] = (typeMap[type] || 0) + 1;
    });

    return Object.entries(typeMap).map(([name, value]) => ({ name, value }));
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
    <Card className="p-6 bg-white rounded-xl border border-gray-200 card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>
          {subtitle && (
            <div className="flex items-center gap-1">
              {trend === 'up' ? (
                <ArrowUpRight className="w-4 h-4 text-green-600" />
              ) : trend === 'down' ? (
                <ArrowDownRight className="w-4 h-4 text-red-600" />
              ) : null}
              <span className="text-sm text-gray-600">{subtitle}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  if (loading) {
    return (
      <div className="flex bg-gray-50">
        <Sidebar user={user} onLogout={onLogout} />
        <div className="flex-1 p-8">
          <div className="text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50" data-testid="dashboard-page">
      <Sidebar user={user} onLogout={onLogout} />
      <FloatingAI />
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              Overview of {selectedBranch} branch performance and analytics
            </p>
          </div>
        </div>

        <div className="p-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Enquiries"
              value={stats.totalEnquiries}
              subtitle="All customer enquiries"
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
              trend="up"
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Executive Performance */}
            <Card className="p-6 bg-white rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Top Executives Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getExecutivePerformance()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="enquiries" fill="#6366f1" name="Enquiries" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="sold" fill="#10b981" name="Sold" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Model Distribution */}
            <Card className="p-6 bg-white rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Top 5 Models</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getModelDistribution()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getModelDistribution().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Enquiry Type Distribution */}
          <Card className="p-6 bg-white rounded-xl border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Enquiry Type Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={getEnquiryTypeDistribution()} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
