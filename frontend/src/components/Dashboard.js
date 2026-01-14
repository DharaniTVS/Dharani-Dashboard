import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import FloatingAI from './FloatingAI';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Users, ShoppingCart, CheckCircle, DollarSign, Target, Activity, RefreshCw, Calendar, Download, FileDown, X, Percent } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = ({ user, onLogout }) => {
  const [salesData, setSalesData] = useState([]);
  const [enquiryData, setEnquiryData] = useState([]);
  const [bookingsData, setBookingsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [stats, setStats] = useState({
    totalSales: 0,
    totalEnquiries: 0,
    totalBookings: 0,
    conversionRate: 0,
    totalDCCollected: 0,
    totalDiscountOperated: 0
  });
  const [salesTrendData, setSalesTrendData] = useState([]);
  const [trendPeriod, setTrendPeriod] = useState('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  
  // Drill-down state
  const [drillDownData, setDrillDownData] = useState(null);
  const [drillDownTitle, setDrillDownTitle] = useState('');

  useEffect(() => {
    const savedBranch = localStorage.getItem('selectedBranch') || 'Kumarapalayam';
    setSelectedBranch(savedBranch);

    const handleBranchChange = (event) => {
      setSelectedBranch(event.detail);
    };

    window.addEventListener('branchChanged', handleBranchChange);
    return () => window.removeEventListener('branchChanged', handleBranchChange);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, enquiryRes, bookingsRes] = await Promise.all([
        axios.get(`${API}/sheets/sales-data`, { params: { branch: selectedBranch } }),
        axios.get(`${API}/sheets/enquiry-data`, { params: { branch: selectedBranch } }),
        axios.get(`${API}/sheets/bookings-data`, { params: { branch: selectedBranch } })
      ]);
      setSalesData(salesRes.data.data || []);
      setEnquiryData(enquiryRes.data.data || []);
      setBookingsData(bookingsRes.data.data || []);
      setLastSync(new Date());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedBranch]);

  useEffect(() => {
    if (selectedBranch) {
      fetchData();
    }
  }, [selectedBranch, fetchData]);

  // Auto-sync every 30 seconds
  useEffect(() => {
    if (!autoSyncEnabled) return;
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoSyncEnabled, fetchData]);

  useEffect(() => {
    if (salesData.length > 0) {
      calculateStats();
      calculateSalesTrend();
    }
  }, [salesData, enquiryData, bookingsData, trendPeriod, startDate, endDate]);

  const calculateStats = () => {
    const totalSales = salesData.length;
    const totalEnquiries = enquiryData.length;
    const totalBookings = bookingsData.length;
    const conversionRate = totalEnquiries > 0 ? ((totalSales / totalEnquiries) * 100).toFixed(1) : 0;
    
    // Calculate Total DC (Document Charges) Collected
    const totalDCCollected = salesData.reduce((sum, record) => {
      const dc = parseFloat(String(record['Document Charges'] || '0').replace(/[^0-9.]/g, ''));
      return sum + (isNaN(dc) ? 0 : dc);
    }, 0);

    // Calculate Total Discount Operated
    const totalDiscountOperated = salesData.reduce((sum, record) => {
      const discountField = record['Discount Operated (₹)'] || record['Discount Operated (â₹)'] || 
                           Object.entries(record).find(([key]) => key.toLowerCase().includes('discount'))?.[1] || '0';
      const discount = parseFloat(String(discountField).replace(/[^0-9.]/g, ''));
      return sum + (isNaN(discount) ? 0 : discount);
    }, 0);

    setStats({
      totalSales,
      totalEnquiries,
      totalBookings,
      conversionRate,
      totalDCCollected,
      totalDiscountOperated
    });
  };

  const calculateSalesTrend = () => {
    // Filter data by date range if set
    let filteredSales = [...salesData];
    if (startDate && endDate) {
      filteredSales = salesData.filter(record => {
        const saleDate = record['Sales Date'];
        if (!saleDate) return false;
        return saleDate >= startDate && saleDate <= endDate;
      });
    }

    // Group by date and executive
    const executiveMap = {};
    const dateMap = {};

    filteredSales.forEach(record => {
      const exec = record['Executive Name'] || 'Unknown';
      const dateStr = record['Sales Date'] || '';
      
      if (!executiveMap[exec]) executiveMap[exec] = true;
      
      let groupKey = dateStr;
      if (trendPeriod === 'weekly') {
        // Group by week
        const date = new Date(dateStr);
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
        groupKey = weekStart.toISOString().split('T')[0];
      } else if (trendPeriod === 'monthly') {
        // Group by month
        groupKey = dateStr.substring(0, 7); // YYYY-MM
      }

      if (!dateMap[groupKey]) {
        dateMap[groupKey] = { date: groupKey };
      }
      dateMap[groupKey][exec] = (dateMap[groupKey][exec] || 0) + 1;
    });

    const trendData = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
    setSalesTrendData(trendData);
  };

  const getExecutives = () => {
    const execs = new Set();
    salesData.forEach(record => {
      if (record['Executive Name']) execs.add(record['Executive Name']);
    });
    return Array.from(execs);
  };

  // Drill-down handlers
  const handleExecutiveDrillDown = (exec) => {
    const data = salesData.filter(record => record['Executive Name'] === exec);
    setDrillDownData(data);
    setDrillDownTitle(`Sales by ${exec}`);
  };

  const closeDrillDown = () => {
    setDrillDownData(null);
    setDrillDownTitle('');
  };

  const formatCurrency = (value) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value}`;
  };

  const exportDrillDownToCSV = () => {
    if (!drillDownData) return;
    const headers = Object.keys(drillDownData[0] || {}).filter(k => k !== 'Branch');
    const csvContent = [
      headers.join(','),
      ...drillDownData.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${drillDownTitle.toLowerCase().replace(/\s/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportDrillDownToPDF = () => {
    if (!drillDownData) return;
    const doc = new jsPDF('landscape');
    doc.setFontSize(18);
    doc.setTextColor(99, 102, 241);
    doc.text(drillDownTitle, 20, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Branch: ${selectedBranch} | Records: ${drillDownData.length}`, 20, 28);

    autoTable(doc, {
      startY: 35,
      head: [['Date', 'Customer', 'Phone', 'Model', 'Category', 'Cost']],
      body: drillDownData.map(row => [
        row['Sales Date'] || '-',
        (row['Customer Name'] || '-').substring(0, 20),
        row['Mobile No'] || '-',
        (row['Vehicle Model'] || '-').substring(0, 15),
        row['Category'] || '-',
        row['Vehicle Cost (₹)'] || Object.entries(row).find(([k]) => k.toLowerCase().includes('vehicle cost'))?.[1] || '-'
      ]),
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] }
    });

    doc.save(`${drillDownTitle.toLowerCase().replace(/\s/g, '-')}.pdf`);
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

  const getCategoryDistribution = () => {
    const categoryMap = {};
    salesData.forEach(record => {
      const category = record['Category'] || 'Other';
      categoryMap[category] = (categoryMap[category] || 0) + 1;
    });

    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  };

  const getPaymentDistribution = () => {
    const paymentMap = {};
    salesData.forEach(record => {
      const payment = record['Cash/HP'] || 'Unknown';
      paymentMap[payment] = (paymentMap[payment] || 0) + 1;
    });

    return Object.entries(paymentMap).map(([name, value]) => ({ name, value }));
  };

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];
  const EXEC_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'];

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-IN').format(value);
  };

  // KPI Card Component
  const KPICard = ({ title, value, icon: Icon, color, bgColor }) => (
    <Card className={`p-5 rounded-xl border-0 shadow-sm ${bgColor}`} data-testid={`kpi-${title.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );

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
              <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">
                <span className="font-medium text-indigo-600">{selectedBranch}</span> branch • Last sync: {lastSync ? lastSync.toLocaleTimeString() : 'Never'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="gap-2 text-gray-600"
                onClick={fetchData}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          {/* Auto-sync indicator */}
          <div className="mt-3 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${autoSyncEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-xs text-gray-500">
              Auto-sync {autoSyncEnabled ? 'enabled' : 'disabled'} (every 30s)
            </span>
            <button 
              onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
              className="text-xs text-indigo-600 hover:underline cursor-pointer"
            >
              {autoSyncEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* KPI Cards - 6 cards in a row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <KPICard
              title="Total Sales"
              value={formatNumber(stats.totalSales)}
              icon={ShoppingCart}
              color="bg-indigo-500"
              bgColor="bg-indigo-50"
            />
            <KPICard
              title="Total Enquiries"
              value={formatNumber(stats.totalEnquiries)}
              icon={Users}
              color="bg-blue-500"
              bgColor="bg-blue-50"
            />
            <KPICard
              title="Total Bookings"
              value={formatNumber(stats.totalBookings)}
              icon={CheckCircle}
              color="bg-green-500"
              bgColor="bg-green-50"
            />
            <KPICard
              title="Conversion Ratio"
              value={`${stats.conversionRate}%`}
              icon={Percent}
              color="bg-purple-500"
              bgColor="bg-purple-50"
            />
            <KPICard
              title="Total DC Collected"
              value={formatCurrency(stats.totalDCCollected)}
              icon={DollarSign}
              color="bg-orange-500"
              bgColor="bg-orange-50"
            />
            <KPICard
              title="Total Discount"
              value={formatCurrency(stats.totalDiscountOperated)}
              icon={Target}
              color="bg-pink-500"
              bgColor="bg-pink-50"
            />
          </div>

          {/* Sales Trend Chart - Line Chart with Executive-wise breakdown */}
          <Card className="p-5 bg-white rounded-xl border-0 shadow-sm mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Sales Trend by Executive</h3>
                <p className="text-xs text-gray-500">Performance trend over time</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Period Selector */}
                <Select value={trendPeriod} onValueChange={setTrendPeriod}>
                  <SelectTrigger className="w-32 bg-white text-gray-900 border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-[100]">
                    <SelectItem value="daily" className="text-gray-900 cursor-pointer hover:bg-indigo-50 data-[highlighted]:bg-indigo-50 data-[highlighted]:text-gray-900">Daily</SelectItem>
                    <SelectItem value="weekly" className="text-gray-900 cursor-pointer hover:bg-indigo-50 data-[highlighted]:bg-indigo-50 data-[highlighted]:text-gray-900">Weekly</SelectItem>
                    <SelectItem value="monthly" className="text-gray-900 cursor-pointer hover:bg-indigo-50 data-[highlighted]:bg-indigo-50 data-[highlighted]:text-gray-900">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                {/* Date Range */}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-36 h-9 text-sm bg-white text-gray-900 border-gray-300"
                    style={{ color: '#1f2937' }}
                  />
                  <span className="text-gray-400">to</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-36 h-9 text-sm bg-white text-gray-900 border-gray-300"
                    style={{ color: '#1f2937' }}
                  />
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={salesTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af" 
                  tick={{ fontSize: 11 }} 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={(value) => {
                    if (trendPeriod === 'monthly') return value;
                    const date = new Date(value);
                    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                  }}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  tick={{ fontSize: 11 }} 
                  axisLine={false} 
                  tickLine={false}
                  label={{ value: 'No. of Sales', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
                />
                <Tooltip 
                  contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
                {getExecutives().map((exec, index) => (
                  <Line
                    key={exec}
                    type="monotone"
                    dataKey={exec}
                    name={exec}
                    stroke={EXEC_COLORS[index % EXEC_COLORS.length]}
                    strokeWidth={2}
                    dot={{ fill: EXEC_COLORS[index % EXEC_COLORS.length], r: 4 }}
                    activeDot={{ r: 6, cursor: 'pointer' }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Bottom Row - Pie Charts and Executive Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Sales by Category - Pie Chart */}
            <Card className="p-5 bg-white rounded-xl border-0 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">Sales by Category</h3>
                <p className="text-xs text-gray-500">Distribution by vehicle type</p>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={getCategoryDistribution()}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {getCategoryDistribution().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cursor="pointer" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {getCategoryDistribution().map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-xs text-gray-600">{entry.name}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Payment Mode - Pie Chart */}
            <Card className="p-5 bg-white rounded-xl border-0 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">Payment Mode</h3>
                <p className="text-xs text-gray-500">Cash vs Finance distribution</p>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={getPaymentDistribution()}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {getPaymentDistribution().map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.name === 'Cash' ? '#10b981' : '#8b5cf6'} 
                        cursor="pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {getPaymentDistribution().map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.name === 'Cash' ? '#10b981' : '#8b5cf6' }}></div>
                    <span className="text-xs text-gray-600">{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Executive Performance */}
            <Card className="p-5 bg-white rounded-xl border-0 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">Executive Performance</h3>
                <p className="text-xs text-gray-500">Top performers by sales count</p>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={getExecutivePerformance()} layout="vertical" barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#9ca3af" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="#9ca3af" 
                    tick={{ fontSize: 10 }} 
                    width={70} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'default' }}
                    formatter={(value) => [value, 'Sales']}
                    cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                  />
                  <Bar 
                    dataKey="sales" 
                    fill="#6366f1" 
                    radius={[0, 6, 6, 0]} 
                    name="Sales"
                    cursor="pointer"
                    onClick={(data) => handleExecutiveDrillDown(data.name)}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      </div>

      {/* Drill-down Modal */}
      {drillDownData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="bg-white rounded-2xl max-w-5xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">{drillDownTitle}</h3>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={exportDrillDownToCSV}
                >
                  <Download className="w-4 h-4 mr-1" /> CSV
                </Button>
                <Button 
                  size="sm"
                  onClick={exportDrillDownToPDF}
                  className="bg-indigo-600"
                >
                  <FileDown className="w-4 h-4 mr-1" /> PDF
                </Button>
                <button onClick={closeDrillDown} className="p-1 hover:bg-gray-100 rounded cursor-pointer">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-4 text-sm text-gray-600">
              {drillDownData.length} records found
            </div>
            <div className="overflow-auto max-h-[60vh]">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {Object.keys(drillDownData[0] || {}).filter(k => k !== 'Branch').map((col, idx) => (
                      <th key={idx} className="text-left text-xs font-semibold text-gray-600 uppercase py-3 px-4 whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {drillDownData.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {Object.keys(drillDownData[0] || {}).filter(k => k !== 'Branch').map((col, colIdx) => (
                        <td key={colIdx} className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">{record[col] || '-'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
