import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import FloatingAI from './FloatingAI';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Building2, DollarSign, Target, Activity, RefreshCw, Calendar, Download, FileText, Users, ShoppingCart, CheckCircle, Percent } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GlobalDashboard = ({ user, onLogout }) => {
  const [allBranchData, setAllBranchData] = useState({});
  const [allEnquiryData, setAllEnquiryData] = useState({});
  const [allBookingsData, setAllBookingsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const [chartStartDate, setChartStartDate] = useState('');
  const [chartEndDate, setChartEndDate] = useState('');
  const [trendPeriod, setTrendPeriod] = useState('daily');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [salesTrendData, setSalesTrendData] = useState([]);

  const branches = ['Kumarapalayam', 'Kavindapadi', 'Ammapettai', 'Anthiyur', 'Bhavani'];

  const fetchAllBranchData = useCallback(async () => {
    setLoading(true);
    try {
      const salesResults = {};
      const enquiryResults = {};
      const bookingsResults = {};
      
      await Promise.all(
        branches.map(async (branch) => {
          const [salesRes, enquiryRes, bookingsRes] = await Promise.all([
            axios.get(`${API}/sheets/sales-data`, { params: { branch } }),
            axios.get(`${API}/sheets/enquiry-data`, { params: { branch } }),
            axios.get(`${API}/sheets/bookings-data`, { params: { branch } })
          ]);
          salesResults[branch] = salesRes.data.data || [];
          enquiryResults[branch] = enquiryRes.data.data || [];
          bookingsResults[branch] = bookingsRes.data.data || [];
        })
      );
      setAllBranchData(salesResults);
      setAllEnquiryData(enquiryResults);
      setAllBookingsData(bookingsResults);
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

  useEffect(() => {
    if (!autoSyncEnabled) return;
    const interval = setInterval(() => {
      fetchAllBranchData();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoSyncEnabled, fetchAllBranchData]);

  useEffect(() => {
    calculateSalesTrend();
  }, [allBranchData, trendPeriod, chartStartDate, chartEndDate]);

  const calculateBranchStats = (salesData, enquiryData, bookingsData) => {
    const totalSold = salesData.length;
    const totalEnquiries = enquiryData.length;
    const totalBookings = bookingsData.length;
    const totalRevenue = salesData.reduce((sum, record) => {
      const costField = Object.entries(record).find(([key]) => key.toLowerCase().includes('vehicle cost'))?.[1] || '0';
      const cost = parseFloat(String(costField).replace(/[^0-9.]/g, ''));
      return sum + (isNaN(cost) ? 0 : cost);
    }, 0);
    const totalDC = salesData.reduce((sum, record) => {
      const dc = parseFloat(String(record['Document Charges'] || '0').replace(/[^0-9.]/g, ''));
      return sum + (isNaN(dc) ? 0 : dc);
    }, 0);
    const totalDiscount = salesData.reduce((sum, record) => {
      const discount = parseFloat(String(record['Discount Operated (₹)'] || record['Discount Operated'] || '0').replace(/[^0-9.]/g, ''));
      return sum + (isNaN(discount) ? 0 : discount);
    }, 0);
    const conversionRate = totalEnquiries > 0 ? ((totalSold / totalEnquiries) * 100).toFixed(1) : 0;
    
    return { totalSold, totalEnquiries, totalBookings, totalRevenue, totalDC, totalDiscount, conversionRate };
  };

  const calculateSalesTrend = () => {
    const allSales = Object.values(allBranchData).flat();
    let filteredSales = [...allSales];
    
    if (chartStartDate && chartEndDate) {
      filteredSales = allSales.filter(record => {
        const saleDate = record['Sales Date'];
        if (!saleDate) return false;
        return saleDate >= chartStartDate && saleDate <= chartEndDate;
      });
    }

    const dateMap = {};
    
    filteredSales.forEach(record => {
      const branch = record['Branch'] || 'Unknown';
      let dateStr = record['Sales Date'] || '';
      let groupKey = dateStr;
      
      if (trendPeriod === 'weekly' && dateStr) {
        const date = new Date(dateStr);
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const weekNum = Math.ceil((((date - startOfYear) / 86400000) + startOfYear.getDay() + 1) / 7);
        groupKey = `W${weekNum}`;
      } else if (trendPeriod === 'monthly' && dateStr) {
        groupKey = dateStr.substring(0, 7);
      }

      if (groupKey) {
        if (!dateMap[groupKey]) {
          dateMap[groupKey] = { date: groupKey };
        }
        dateMap[groupKey][branch] = (dateMap[groupKey][branch] || 0) + 1;
      }
    });

    let trendData = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
    if (trendData.length > 15) {
      trendData = trendData.slice(-15);
    }
    setSalesTrendData(trendData);
  };

  const getTotalStats = () => {
    let totalSold = 0, totalEnquiries = 0, totalBookings = 0, totalRevenue = 0, totalDC = 0, totalDiscount = 0;

    branches.forEach(branch => {
      const stats = calculateBranchStats(
        allBranchData[branch] || [],
        allEnquiryData[branch] || [],
        allBookingsData[branch] || []
      );
      totalSold += stats.totalSold;
      totalEnquiries += stats.totalEnquiries;
      totalBookings += stats.totalBookings;
      totalRevenue += stats.totalRevenue;
      totalDC += stats.totalDC;
      totalDiscount += stats.totalDiscount;
    });

    const conversionRate = totalEnquiries > 0 ? ((totalSold / totalEnquiries) * 100).toFixed(1) : 0;
    return { totalSold, totalEnquiries, totalBookings, totalRevenue, totalDC, totalDiscount, conversionRate };
  };

  const getBranchComparisonData = () => {
    return branches.map(branch => {
      const stats = calculateBranchStats(
        allBranchData[branch] || [],
        allEnquiryData[branch] || [],
        allBookingsData[branch] || []
      );
      return {
        name: branch.substring(0, 6),
        fullName: branch,
        sales: stats.totalSold,
        enquiries: stats.totalEnquiries,
        bookings: stats.totalBookings,
        revenue: stats.totalRevenue
      };
    });
  };

  const getCategoryDistribution = () => {
    const categoryMap = {};
    Object.values(allBranchData).flat().forEach(record => {
      const category = record['Category'] || 'Other';
      categoryMap[category] = (categoryMap[category] || 0) + 1;
    });
    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  };

  const getPaymentDistribution = () => {
    const paymentMap = {};
    Object.values(allBranchData).flat().forEach(record => {
      const payment = record['Cash/HP'] || 'Unknown';
      paymentMap[payment] = (paymentMap[payment] || 0) + 1;
    });
    return Object.entries(paymentMap).map(([name, value]) => ({ name, value }));
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

    doc.setFontSize(18);
    doc.setTextColor(99, 102, 241);
    doc.text('Dharani TVS - Main Dashboard Report', 20, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 28);

    autoTable(doc, {
      startY: 40,
      head: [['Metric', 'Value']],
      body: [
        ['Total Sales', formatNumber(stats.totalSold)],
        ['Total Enquiries', formatNumber(stats.totalEnquiries)],
        ['Total Bookings', formatNumber(stats.totalBookings)],
        ['Conversion Rate', `${stats.conversionRate}%`],
        ['Total DC Collected', formatCurrency(stats.totalDC)],
        ['Total Discount', formatCurrency(stats.totalDiscount)]
      ],
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] }
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [['Branch', 'Sales', 'Enquiries', 'Bookings', 'Revenue']],
      body: branchData.map(b => [b.fullName, b.sales, b.enquiries, b.bookings, formatCurrency(b.revenue)]),
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] }
    });

    doc.save(`main-dashboard-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToCSV = () => {
    const branchData = getBranchComparisonData();
    const headers = ['Branch', 'Sales', 'Enquiries', 'Bookings', 'Revenue'];
    const csvContent = [
      headers.join(','),
      ...branchData.map(b => [b.fullName, b.sales, b.enquiries, b.bookings, b.revenue].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `main-dashboard-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];
  const stats = getTotalStats();

  const KPICard = ({ title, value, icon: Icon, color, bgColor }) => (
    <Card className={`p-4 rounded-xl border-0 shadow-sm ${bgColor}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </Card>
  );

  if (loading && Object.keys(allBranchData).length === 0) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar user={user} onLogout={onLogout} />
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading all branch data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen" data-testid="global-dashboard">
      <Sidebar user={user} onLogout={onLogout} />
      <FloatingAI />
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-indigo-600" />
                Main Dashboard
              </h1>
              <p className="text-sm text-gray-500">All branches • Last sync: {lastSync ? lastSync.toLocaleTimeString() : 'Never'}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchAllBranchData} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="w-4 h-4" />
              </Button>
              <Button size="sm" className="bg-indigo-600" onClick={exportToPDF}>
                <FileText className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-1 ml-2">
                <div className={`w-2 h-2 rounded-full ${autoSyncEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <button onClick={() => setAutoSyncEnabled(!autoSyncEnabled)} className="text-xs text-gray-500 hover:text-indigo-600" style={{ cursor: 'pointer' }}>
                  {autoSyncEnabled ? 'Auto' : 'Manual'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KPICard title="Total Sales" value={formatNumber(stats.totalSold)} icon={ShoppingCart} color="bg-indigo-500" bgColor="bg-white" />
            <KPICard title="Total Enquiries" value={formatNumber(stats.totalEnquiries)} icon={Users} color="bg-blue-500" bgColor="bg-white" />
            <KPICard title="Total Bookings" value={formatNumber(stats.totalBookings)} icon={CheckCircle} color="bg-green-500" bgColor="bg-white" />
            <KPICard title="Conversion %" value={`${stats.conversionRate}%`} icon={Percent} color="bg-purple-500" bgColor="bg-white" />
            <KPICard title="DC Collected" value={formatCurrency(stats.totalDC)} icon={DollarSign} color="bg-orange-500" bgColor="bg-white" />
            <KPICard title="Discount" value={formatCurrency(stats.totalDiscount)} icon={Target} color="bg-pink-500" bgColor="bg-white" />
          </div>

          {/* Sales Trend by Branch - Line Chart */}
          <Card className="p-5 bg-white rounded-xl shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Sales Trend by Branch</h3>
                <p className="text-xs text-gray-500">Performance comparison over time</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={trendPeriod} onValueChange={setTrendPeriod}>
                  <SelectTrigger className="w-28 h-8 text-sm bg-white border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg z-[9999]">
                    <SelectItem value="daily" className="cursor-pointer hover:bg-gray-100">Daily</SelectItem>
                    <SelectItem value="weekly" className="cursor-pointer hover:bg-gray-100">Weekly</SelectItem>
                    <SelectItem value="monthly" className="cursor-pointer hover:bg-gray-100">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1">
                  <Input
                    type="date"
                    value={chartStartDate}
                    onChange={(e) => setChartStartDate(e.target.value)}
                    className="w-32 h-8 text-xs bg-white border-gray-200"
                    style={{ color: '#1f2937' }}
                  />
                  <span className="text-gray-400 text-xs">to</span>
                  <Input
                    type="date"
                    value={chartEndDate}
                    onChange={(e) => setChartEndDate(e.target.value)}
                    className="w-32 h-8 text-xs bg-white border-gray-200"
                    style={{ color: '#1f2937' }}
                  />
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={salesTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                {branches.map((branch, index) => (
                  <Line
                    key={branch}
                    type="monotone"
                    dataKey={branch}
                    name={branch.substring(0, 8)}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3, fill: COLORS[index % COLORS.length] }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Branch Comparison + Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Sales by Branch Bar Chart */}
            <Card className="p-4 bg-white rounded-xl shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Sales by Branch</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={getBranchComparisonData()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={50} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => [value, 'Sales']} cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} />
                  <Bar dataKey="sales" radius={[0, 4, 4, 0]} style={{ cursor: 'pointer' }}>
                    {getBranchComparisonData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Revenue by Branch Bar Chart */}
            <Card className="p-4 bg-white rounded-xl shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Revenue by Branch</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={getBranchComparisonData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v/100000}L`} />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]} style={{ cursor: 'pointer' }}>
                    {getBranchComparisonData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Pie Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Category Pie Chart */}
            <Card className="p-4 bg-white rounded-xl shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Sales by Category</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={getCategoryDistribution()}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {getCategoryDistribution().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{ cursor: 'pointer' }} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {getCategoryDistribution().map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-xs text-gray-600">{entry.name}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Payment Mode Pie Chart */}
            <Card className="p-4 bg-white rounded-xl shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Payment Mode</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={getPaymentDistribution()}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {getPaymentDistribution().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'Cash' ? '#10b981' : '#8b5cf6'} style={{ cursor: 'pointer' }} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-4 justify-center mt-2">
                {getPaymentDistribution().map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.name === 'Cash' ? '#10b981' : '#8b5cf6' }}></div>
                    <span className="text-xs text-gray-600">{entry.name}: {entry.value}</span>
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
