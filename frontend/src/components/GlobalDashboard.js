import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import FloatingAI from './FloatingAI';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Building2, DollarSign, Target, RefreshCw, Download, FileText, Users, ShoppingCart, CheckCircle, Percent, Search, X } from 'lucide-react';
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
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  
  // Filter states
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [trendPeriod, setTrendPeriod] = useState('daily');
  
  // Stats
  const [stats, setStats] = useState({
    totalSales: 0,
    totalEnquiries: 0,
    totalBookings: 0,
    conversionRate: 0,
    totalDC: 0,
    totalDiscount: 0
  });
  
  // Trend data
  const [salesTrendData, setSalesTrendData] = useState([]);
  const [enquiryTrendData, setEnquiryTrendData] = useState([]);
  const [bookingsTrendData, setBookingsTrendData] = useState([]);

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

  // Apply filters and calculate
  const applyFiltersAndCalculate = () => {
    // Filter and aggregate all branch data
    let filteredSales = [];
    let filteredEnquiries = [];
    let filteredBookings = [];

    branches.forEach(branch => {
      let branchSales = allBranchData[branch] || [];
      let branchEnquiries = allEnquiryData[branch] || [];
      let branchBookings = allBookingsData[branch] || [];

      if (startDate && endDate) {
        branchSales = branchSales.filter(record => {
          const date = record['Sales Date'];
          return date && date >= startDate && date <= endDate;
        });
        branchEnquiries = branchEnquiries.filter(record => {
          const date = record['Date'] || record['Enquiry Date'];
          return date && date >= startDate && date <= endDate;
        });
        branchBookings = branchBookings.filter(record => {
          const date = record['Booking Date'] || record['Date'];
          return date && date >= startDate && date <= endDate;
        });
      }

      filteredSales = [...filteredSales, ...branchSales.map(r => ({ ...r, Branch: branch }))];
      filteredEnquiries = [...filteredEnquiries, ...branchEnquiries.map(r => ({ ...r, Branch: branch }))];
      filteredBookings = [...filteredBookings, ...branchBookings.map(r => ({ ...r, Branch: branch }))];
    });

    // Calculate stats
    const totalSales = filteredSales.length;
    const totalEnquiries = filteredEnquiries.length;
    const totalBookings = filteredBookings.length;
    const conversionRate = totalEnquiries > 0 ? ((totalSales / totalEnquiries) * 100).toFixed(1) : 0;

    const totalDC = filteredSales.reduce((sum, record) => {
      const dc = parseFloat(String(record['Document Charges'] || '0').replace(/[^0-9.]/g, ''));
      return sum + (isNaN(dc) ? 0 : dc);
    }, 0);

    const totalDiscount = filteredSales.reduce((sum, record) => {
      const discount = parseFloat(String(record['Discount Operated (₹)'] || record['Discount Operated'] || '0').replace(/[^0-9.]/g, ''));
      return sum + (isNaN(discount) ? 0 : discount);
    }, 0);

    setStats({ totalSales, totalEnquiries, totalBookings, conversionRate, totalDC, totalDiscount });

    // Calculate trends by branch
    calculateBranchTrend(filteredSales, 'Sales Date', setSalesTrendData);
    calculateBranchTrend(filteredEnquiries, 'Date', setEnquiryTrendData);
    calculateBranchTrend(filteredBookings, 'Booking Date', setBookingsTrendData);
  };

  const calculateBranchTrend = (data, dateField, setTrendData) => {
    const dateMap = {};

    data.forEach(record => {
      const branch = record['Branch'] || 'Unknown';
      let dateStr = record[dateField] || record['Date'] || '';
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
    setTrendData(trendData);
  };

  // Initial calculation
  useEffect(() => {
    if (Object.keys(allBranchData).length > 0) {
      applyFiltersAndCalculate();
    }
  }, [allBranchData, allEnquiryData, allBookingsData]);

  const handleSubmit = () => {
    applyFiltersAndCalculate();
  };

  const getBranchComparisonData = () => {
    return branches.map(branch => {
      const salesData = allBranchData[branch] || [];
      const enquiryData = allEnquiryData[branch] || [];
      const bookingsData = allBookingsData[branch] || [];
      
      const totalRevenue = salesData.reduce((sum, record) => {
        const costField = Object.entries(record).find(([key]) => key.toLowerCase().includes('vehicle cost'))?.[1] || '0';
        const cost = parseFloat(String(costField).replace(/[^0-9.]/g, ''));
        return sum + (isNaN(cost) ? 0 : cost);
      }, 0);

      return {
        name: branch.substring(0, 6),
        fullName: branch,
        sales: salesData.length,
        enquiries: enquiryData.length,
        bookings: bookingsData.length,
        revenue: totalRevenue
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
    const doc = new jsPDF('landscape', 'mm', 'a3');
    const branchData = getBranchComparisonData();

    doc.setFontSize(16);
    doc.setTextColor(99, 102, 241);
    doc.text('Dharani TVS - Main Dashboard Report', 20, 15);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()} | Date Range: ${startDate || 'All'} to ${endDate || 'All'}`, 20, 22);

    // KPI Summary
    autoTable(doc, {
      startY: 30,
      head: [['Total Sales', 'Total Enquiries', 'Total Bookings', 'Conversion %', 'DC Collected', 'Total Discount']],
      body: [[
        formatNumber(stats.totalSales),
        formatNumber(stats.totalEnquiries),
        formatNumber(stats.totalBookings),
        `${stats.conversionRate}%`,
        formatCurrency(stats.totalDC),
        formatCurrency(stats.totalDiscount)
      ]],
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241], fontSize: 8 },
      styles: { fontSize: 9, halign: 'center' }
    });

    // Branch comparison
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Branch', 'Sales', 'Enquiries', 'Bookings', 'Revenue', 'Conversion %']],
      body: branchData.map(b => [
        b.fullName, 
        b.sales, 
        b.enquiries, 
        b.bookings, 
        formatCurrency(b.revenue),
        b.enquiries > 0 ? ((b.sales / b.enquiries) * 100).toFixed(1) + '%' : '0%'
      ]),
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241], fontSize: 8 },
      styles: { fontSize: 8 }
    });

    // All sales data from all branches
    const allSalesData = Object.values(allBranchData).flat();
    if (allSalesData.length > 0) {
      const allHeaders = [...new Set(allSalesData.flatMap(row => Object.keys(row)))].filter(h => h !== 'Branch');
      
      doc.addPage('a3', 'landscape');
      doc.setFontSize(14);
      doc.setTextColor(99, 102, 241);
      doc.text('All Sales Data', 20, 15);
      
      autoTable(doc, {
        startY: 22,
        head: [allHeaders.map(h => h.length > 12 ? h.substring(0, 12) + '..' : h)],
        body: allSalesData.slice(0, 500).map(row => 
          allHeaders.map(h => {
            const value = row[h] || '-';
            return String(value).length > 15 ? String(value).substring(0, 15) + '..' : String(value);
          })
        ),
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241], fontSize: 5, cellPadding: 1 },
        styles: { fontSize: 5, cellPadding: 1 }
      });
    }

    doc.save(`main-dashboard-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToCSV = () => {
    // Export all sales data from all branches
    const allSalesData = Object.values(allBranchData).flat();
    
    if (allSalesData.length === 0) {
      alert('No data to export');
      return;
    }
    
    const allHeaders = [...new Set(allSalesData.flatMap(row => Object.keys(row)))];
    
    const csvContent = [
      allHeaders.join(','),
      ...allSalesData.map(row => 
        allHeaders.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-branches-sales-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

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
      <div className="flex-1 overflow-auto pt-16 lg:pt-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-indigo-600" />
                Overview
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
                <button onClick={() => setAutoSyncEnabled(!autoSyncEnabled)} className="text-xs text-gray-600 hover:text-indigo-700 focus:outline-none focus:text-indigo-700" style={{ cursor: 'pointer', backgroundColor: 'transparent' }}>
                  {autoSyncEnabled ? 'Auto' : 'Manual'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Filters Section */}
          <Card className="p-4 bg-white rounded-xl shadow-sm">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-36 h-9 text-sm bg-white border-gray-200"
                  style={{ color: '#1f2937' }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-36 h-9 text-sm bg-white border-gray-200"
                  style={{ color: '#1f2937' }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Period</label>
                <Select value={trendPeriod} onValueChange={setTrendPeriod}>
                  <SelectTrigger className="w-28 h-9 text-sm bg-white border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg z-[9999]">
                    <SelectItem value="daily" className="cursor-pointer hover:bg-gray-100">Daily</SelectItem>
                    <SelectItem value="weekly" className="cursor-pointer hover:bg-gray-100">Weekly</SelectItem>
                    <SelectItem value="monthly" className="cursor-pointer hover:bg-gray-100">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSubmit} className="h-9 bg-indigo-600 hover:bg-indigo-700">
                <Search className="w-4 h-4 mr-1" /> Submit
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setTrendPeriod('daily');
                  setTimeout(() => applyFiltersAndCalculate(), 100);
                }} 
                className="h-9 text-gray-600 hover:text-gray-800"
              >
                <X className="w-4 h-4 mr-1" /> Reset
              </Button>
            </div>
          </Card>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KPICard title="Total Sales" value={formatNumber(stats.totalSales)} icon={ShoppingCart} color="bg-indigo-500" bgColor="bg-white" />
            <KPICard title="Total Enquiries" value={formatNumber(stats.totalEnquiries)} icon={Users} color="bg-blue-500" bgColor="bg-white" />
            <KPICard title="Total Bookings" value={formatNumber(stats.totalBookings)} icon={CheckCircle} color="bg-green-500" bgColor="bg-white" />
            <KPICard title="Conversion %" value={`${stats.conversionRate}%`} icon={Percent} color="bg-purple-500" bgColor="bg-white" />
            <KPICard title="DC Collected" value={formatCurrency(stats.totalDC)} icon={DollarSign} color="bg-orange-500" bgColor="bg-white" />
            <KPICard title="Discount" value={formatCurrency(stats.totalDiscount)} icon={Target} color="bg-pink-500" bgColor="bg-white" />
          </div>

          {/* Sales Trend by Branch */}
          <Card className="p-5 bg-white rounded-xl shadow-sm">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-gray-900">Sales Trend by Branch</h3>
              <p className="text-xs text-gray-500">Branch-wise sales performance over time</p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={salesTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                {branches.map((branch, index) => (
                  <Line key={branch} type="monotone" dataKey={branch} name={branch.substring(0, 8)} stroke={COLORS[index % COLORS.length]} strokeWidth={2} dot={{ r: 3, fill: COLORS[index % COLORS.length] }} activeDot={{ r: 5 }} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Enquiry and Bookings Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Enquiry Trend */}
            <Card className="p-5 bg-white rounded-xl shadow-sm">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-900">Enquiry Trend by Branch</h3>
                <p className="text-xs text-gray-500">Enquiries over time</p>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={enquiryTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  {branches.map((branch, index) => (
                    <Line key={branch} type="monotone" dataKey={branch} name={branch.substring(0, 6)} stroke={COLORS[index % COLORS.length]} strokeWidth={2} dot={{ r: 2 }} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Bookings Trend */}
            <Card className="p-5 bg-white rounded-xl shadow-sm">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-900">Bookings Trend by Branch</h3>
                <p className="text-xs text-gray-500">Bookings over time</p>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={bookingsTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  {branches.map((branch, index) => (
                    <Line key={branch} type="monotone" dataKey={branch} name={branch.substring(0, 6)} stroke={COLORS[index % COLORS.length]} strokeWidth={2} dot={{ r: 2 }} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

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
                  <Pie data={getCategoryDistribution()} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
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
                  <Pie data={getPaymentDistribution()} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
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
