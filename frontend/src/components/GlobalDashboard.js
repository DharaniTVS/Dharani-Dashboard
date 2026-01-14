import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import FloatingAI from './FloatingAI';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Building2, DollarSign, Target, Activity, RefreshCw, Calendar, Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GlobalDashboard = ({ user, onLogout }) => {
  const [allBranchData, setAllBranchData] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  const branches = ['Kumarapalayam', 'Kavindapadi', 'Ammapettai', 'Anthiyur', 'Bhavani'];

  const fetchAllBranchData = useCallback(async () => {
    setLoading(true);
    try {
      const results = {};
      await Promise.all(
        branches.map(async (branch) => {
          const response = await axios.get(`${API}/sheets/sales-data`, {
            params: { branch }
          });
          results[branch] = response.data.data || [];
        })
      );
      setAllBranchData(results);
      setLastSync(new Date());
    } catch (error) {
      console.error('Failed to fetch all branch data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllBranchData();
  }, [fetchAllBranchData]);

  // Auto-sync every 30 seconds
  useEffect(() => {
    if (!autoSyncEnabled) return;
    
    const interval = setInterval(() => {
      fetchAllBranchData();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoSyncEnabled, fetchAllBranchData]);

  const calculateBranchStats = (data) => {
    const totalSold = data.length;
    const totalRevenue = data.reduce((sum, record) => {
      const costField = Object.entries(record).find(([key]) => key.toLowerCase().includes('vehicle cost'))?.[1] || '0';
      const cost = parseFloat(String(costField).replace(/[^0-9.]/g, ''));
      return sum + (isNaN(cost) ? 0 : cost);
    }, 0);
    return { totalSold, totalRevenue, avgOrderValue: totalSold > 0 ? totalRevenue / totalSold : 0 };
  };

  const getBranchComparisonData = () => {
    return branches.map(branch => {
      const data = allBranchData[branch] || [];
      const stats = calculateBranchStats(data);
      return {
        name: branch.substring(0, 8),
        fullName: branch,
        sales: stats.totalSold,
        revenue: stats.totalRevenue,
        aov: stats.avgOrderValue
      };
    });
  };

  const getTotalStats = () => {
    let totalSold = 0;
    let totalRevenue = 0;

    Object.values(allBranchData).forEach(data => {
      const stats = calculateBranchStats(data);
      totalSold += stats.totalSold;
      totalRevenue += stats.totalRevenue;
    });

    return {
      totalSold,
      totalRevenue,
      avgOrderValue: totalSold > 0 ? totalRevenue / totalSold : 0,
      totalBranches: branches.length
    };
  };

  const getCategoryDistribution = () => {
    const categoryMap = {};
    Object.values(allBranchData).flat().forEach(record => {
      const category = record['Category'] || 'Other';
      categoryMap[category] = (categoryMap[category] || 0) + 1;
    });
    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  };

  const getTopExecutivesAcrossBranches = () => {
    const execMap = {};
    Object.entries(allBranchData).forEach(([branch, data]) => {
      data.forEach(record => {
        const exec = record['Executive Name'] || 'Unknown';
        const key = `${exec} (${branch.substring(0, 4)})`;
        if (!execMap[key]) {
          execMap[key] = { name: exec, branch, sales: 0 };
        }
        execMap[key].sales += 1;
      });
    });
    return Object.values(execMap).sort((a, b) => b.sales - a.sales).slice(0, 10);
  };

  const formatCurrency = (value) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value}`;
  };

  const formatNumber = (value) => new Intl.NumberFormat('en-IN').format(value);

  const exportToPDF = () => {
    const doc = new jsPDF();
    const stats = getTotalStats();
    const branchData = getBranchComparisonData();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(99, 102, 241);
    doc.text('Dharani TVS - Global Dashboard Report', 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 28);

    // Summary Stats
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Summary Statistics', 20, 45);

    autoTable(doc, {
      startY: 50,
      head: [['Metric', 'Value']],
      body: [
        ['Total Revenue', formatCurrency(stats.totalRevenue)],
        ['Total Units Sold', formatNumber(stats.totalSold)],
        ['Average Order Value', formatCurrency(stats.avgOrderValue)],
        ['Active Branches', stats.totalBranches.toString()]
      ],
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] }
    });

    // Branch Comparison
    doc.setFontSize(14);
    doc.text('Branch Comparison', 20, doc.lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Branch', 'Sales', 'Revenue', 'Avg Order Value']],
      body: branchData.map(b => [
        b.fullName,
        b.sales.toString(),
        formatCurrency(b.revenue),
        formatCurrency(b.aov)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] }
    });

    doc.save(`global-dashboard-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToCSV = () => {
    const branchData = getBranchComparisonData();
    const headers = ['Branch', 'Sales', 'Revenue', 'Average Order Value'];
    const csvContent = [
      headers.join(','),
      ...branchData.map(b => [b.fullName, b.sales, b.revenue, b.aov].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `global-dashboard-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  const stats = getTotalStats();

  if (loading && Object.keys(allBranchData).length === 0) {
    return (
      <div className="flex bg-gray-50 dark:bg-slate-900 min-h-screen">
        <Sidebar user={user} onLogout={onLogout} />
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading all branch data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 dark:bg-slate-900 min-h-screen" data-testid="global-dashboard">
      <Sidebar user={user} onLogout={onLogout} />
      <FloatingAI />
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-7 h-7 text-indigo-600" />
                Main Dashboard
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                All branches performance overview • Last sync: {lastSync ? lastSync.toLocaleTimeString() : 'Never'}
                {loading && <span className="ml-2 text-indigo-600">Syncing...</span>}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Date Filter */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <Input
                  type="date" style={{ color: "#1f2937" }}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-36 h-9 text-sm bg-white dark:bg-slate-700"
                  placeholder="Start"
                />
                <span className="text-gray-400">-</span>
                <Input
                  type="date" style={{ color: "#1f2937" }}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-36 h-9 text-sm bg-white dark:bg-slate-700"
                  placeholder="End"
                />
              </div>
              <Button 
                variant="outline" 
                className="gap-2 text-gray-600 dark:text-gray-300"
                onClick={fetchAllBranchData}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                className="gap-2 text-gray-600 dark:text-gray-300"
                onClick={exportToCSV}
              >
                <Download className="w-4 h-4" />
                CSV
              </Button>
              <Button 
                className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                onClick={exportToPDF}
              >
                <FileText className="w-4 h-4" />
                PDF
              </Button>
            </div>
          </div>
          {/* Auto-sync indicator */}
          <div className="mt-3 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${autoSyncEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Auto-sync {autoSyncEnabled ? 'enabled' : 'disabled'} (every 30s)
            </span>
            <button 
              onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
              className="text-xs text-indigo-600 hover:underline"
            >
              {autoSyncEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Global KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl border-0 text-white">
              <DollarSign className="w-8 h-8 mb-3 opacity-80" />
              <h3 className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</h3>
              <p className="text-indigo-100 text-sm">Total Revenue (All Branches)</p>
            </Card>
            <Card className="p-5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl border-0 text-white">
              <Target className="w-8 h-8 mb-3 opacity-80" />
              <h3 className="text-3xl font-bold">{formatNumber(stats.totalSold)}</h3>
              <p className="text-purple-100 text-sm">Total Units Sold</p>
            </Card>
            <Card className="p-5 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl border-0 text-white">
              <Activity className="w-8 h-8 mb-3 opacity-80" />
              <h3 className="text-3xl font-bold">{formatCurrency(stats.avgOrderValue)}</h3>
              <p className="text-pink-100 text-sm">Average Order Value</p>
            </Card>
            <Card className="p-5 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl border-0 text-white">
              <Building2 className="w-8 h-8 mb-3 opacity-80" />
              <h3 className="text-3xl font-bold">{stats.totalBranches}</h3>
              <p className="text-green-100 text-sm">Active Branches</p>
            </Card>
          </div>

          {/* Branch Comparison Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Revenue by Branch */}
            <Card className="p-5 bg-white dark:bg-slate-800 rounded-2xl border-0 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Revenue by Branch</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getBranchComparisonData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v/100000}L`} />
                  <Tooltip 
                    formatter={(value, name) => [formatCurrency(value), 'Revenue']}
                    labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
                  />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                    {getBranchComparisonData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Sales by Branch */}
            <Card className="p-5 bg-white dark:bg-slate-800 rounded-2xl border-0 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Units Sold by Branch</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getBranchComparisonData()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" stroke="#9ca3af" tick={{ fontSize: 11 }} width={70} />
                  <Tooltip 
                    formatter={(value) => [value, 'Units Sold']}
                    labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
                  />
                  <Bar dataKey="sales" radius={[0, 6, 6, 0]}>
                    {getBranchComparisonData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution */}
            <Card className="p-5 bg-white dark:bg-slate-800 rounded-2xl border-0 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Category Distribution (All Branches)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={getCategoryDistribution()}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {getCategoryDistribution().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cursor="pointer" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Top Executives */}
            <Card className="p-5 bg-white dark:bg-slate-800 rounded-2xl border-0 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Top Executives (All Branches)</h3>
              <div className="space-y-3 max-h-[250px] overflow-y-auto">
                {getTopExecutivesAcrossBranches().map((exec, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{exec.name}</span>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{exec.sales}</span>
                      </div>
                      <span className="text-xs text-gray-500">{exec.branch}</span>
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

export default GlobalDashboard;
