import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import FloatingAI from './FloatingAI';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Users, ShoppingCart, CheckCircle, DollarSign, Target, RefreshCw, Calendar, Download, FileDown, X, Percent, Search } from 'lucide-react';
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
  
  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [trendPeriod, setTrendPeriod] = useState('daily');
  const [selectedExecutive, setSelectedExecutive] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Trend data
  const [salesTrendData, setSalesTrendData] = useState([]);
  const [enquiryTrendData, setEnquiryTrendData] = useState([]);
  const [bookingsTrendData, setBookingsTrendData] = useState([]);
  
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  
  // Drill-down state
  const [drillDownData, setDrillDownData] = useState(null);
  const [drillDownTitle, setDrillDownTitle] = useState('');

  const branches = ['Kumarapalayam', 'Kavindapadi', 'Ammapettai', 'Anthiyur', 'Bhavani'];

  useEffect(() => {
    const savedBranch = localStorage.getItem('selectedBranch') || 'all';
    setSelectedBranch(savedBranch);

    const handleBranchChange = (event) => {
      setSelectedBranch(event.detail);
    };

    window.addEventListener('branchChanged', handleBranchChange);
    return () => window.removeEventListener('branchChanged', handleBranchChange);
  }, []);

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
    localStorage.setItem('selectedBranch', branch);
    window.dispatchEvent(new CustomEvent('branchChanged', { detail: branch }));
  };

  const fetchData = useCallback(async () => {
    if (!selectedBranch) return;
    
    setLoading(true);
    try {
      if (selectedBranch === 'all') {
        // Fetch data from all branches
        const allBranches = ['Kumarapalayam', 'Kavindapadi', 'Ammapettai', 'Anthiyur', 'Bhavani'];
        const results = await Promise.all(
          allBranches.map(async (branch) => {
            const [salesRes, enquiryRes, bookingsRes] = await Promise.all([
              axios.get(`${API}/sheets/sales-data`, { params: { branch } }),
              axios.get(`${API}/sheets/enquiry-data`, { params: { branch } }),
              axios.get(`${API}/sheets/bookings-data`, { params: { branch } })
            ]);
            return {
              sales: salesRes.data.data || [],
              enquiry: enquiryRes.data.data || [],
              bookings: bookingsRes.data.data || []
            };
          })
        );
        
        // Combine all data
        setSalesData(results.flatMap(r => r.sales));
        setEnquiryData(results.flatMap(r => r.enquiry));
        setBookingsData(results.flatMap(r => r.bookings));
      } else {
        // Fetch data from specific branch
        const [salesRes, enquiryRes, bookingsRes] = await Promise.all([
          axios.get(`${API}/sheets/sales-data`, { params: { branch: selectedBranch } }),
          axios.get(`${API}/sheets/enquiry-data`, { params: { branch: selectedBranch } }),
          axios.get(`${API}/sheets/bookings-data`, { params: { branch: selectedBranch } })
        ]);
        setSalesData(salesRes.data.data || []);
        setEnquiryData(enquiryRes.data.data || []);
        setBookingsData(bookingsRes.data.data || []);
      }
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

  useEffect(() => {
    if (!autoSyncEnabled) return;
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoSyncEnabled, fetchData]);

  // Get unique executives and categories
  const getExecutives = () => {
    const execs = new Set();
    salesData.forEach(record => {
      if (record['Executive Name']) execs.add(record['Executive Name']);
    });
    return Array.from(execs);
  };

  const getCategories = () => {
    const cats = new Set();
    salesData.forEach(record => {
      if (record['Category']) cats.add(record['Category']);
    });
    return Array.from(cats);
  };

  // Apply filters and calculate trends
  const applyFiltersAndCalculate = () => {
    // Filter sales data
    let filteredSales = [...salesData];
    if (startDate && endDate) {
      filteredSales = filteredSales.filter(record => {
        const saleDate = record['Sales Date'];
        return saleDate && saleDate >= startDate && saleDate <= endDate;
      });
    }
    if (selectedExecutive !== 'all') {
      filteredSales = filteredSales.filter(record => record['Executive Name'] === selectedExecutive);
    }
    if (selectedCategory !== 'all') {
      filteredSales = filteredSales.filter(record => record['Category'] === selectedCategory);
    }

    // Filter enquiry data
    let filteredEnquiry = [...enquiryData];
    if (startDate && endDate) {
      filteredEnquiry = filteredEnquiry.filter(record => {
        const date = record['Date'] || record['Enquiry Date'];
        return date && date >= startDate && date <= endDate;
      });
    }

    // Filter bookings data
    let filteredBookings = [...bookingsData];
    if (startDate && endDate) {
      filteredBookings = filteredBookings.filter(record => {
        const date = record['Booking Date'] || record['Date'];
        return date && date >= startDate && date <= endDate;
      });
    }

    // Calculate stats
    const totalSales = filteredSales.length;
    const totalEnquiries = filteredEnquiry.length;
    const totalBookings = filteredBookings.length;
    const conversionRate = totalEnquiries > 0 ? ((totalSales / totalEnquiries) * 100).toFixed(1) : 0;
    
    const totalDCCollected = filteredSales.reduce((sum, record) => {
      const dc = parseFloat(String(record['Document Charges'] || '0').replace(/[^0-9.]/g, ''));
      return sum + (isNaN(dc) ? 0 : dc);
    }, 0);

    const totalDiscountOperated = filteredSales.reduce((sum, record) => {
      const discountField = record['Discount Operated (₹)'] || record['Discount Operated'] || 
                           Object.entries(record).find(([key]) => key.toLowerCase().includes('discount'))?.[1] || '0';
      const discount = parseFloat(String(discountField).replace(/[^0-9.]/g, ''));
      return sum + (isNaN(discount) ? 0 : discount);
    }, 0);

    setStats({ totalSales, totalEnquiries, totalBookings, conversionRate, totalDCCollected, totalDiscountOperated });

    // Calculate Sales Trend
    calculateTrend(filteredSales, 'Sales Date', 'Executive Name', setSalesTrendData);
    
    // Calculate Enquiry Trend
    calculateTrend(filteredEnquiry, 'Date', 'Executive', setEnquiryTrendData, true);
    
    // Calculate Bookings Trend
    calculateTrend(filteredBookings, 'Booking Date', 'Executive', setBookingsTrendData, true);
  };

  const calculateTrend = (data, dateField, groupField, setTrendData, simpleCount = false) => {
    const dateMap = {};
    const groups = new Set();

    data.forEach(record => {
      const group = simpleCount ? 'Count' : (record[groupField] || 'Unknown');
      groups.add(group);
      
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
        dateMap[groupKey][group] = (dateMap[groupKey][group] || 0) + 1;
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
    if (salesData.length > 0 || enquiryData.length > 0 || bookingsData.length > 0) {
      applyFiltersAndCalculate();
    }
  }, [salesData, enquiryData, bookingsData]);

  const handleSubmit = () => {
    applyFiltersAndCalculate();
  };

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

  const formatNumber = (value) => new Intl.NumberFormat('en-IN').format(value);

  const exportDrillDownToCSV = () => {
    if (!drillDownData || drillDownData.length === 0) return;
    
    // Get all unique headers from the data (excluding Branch)
    const headers = [...new Set(drillDownData.flatMap(row => Object.keys(row)))].filter(k => k !== 'Branch');
    
    const csvContent = [
      headers.join(','),
      ...drillDownData.map(row => headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${drillDownTitle.toLowerCase().replace(/\s/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportDrillDownToPDF = () => {
    if (!drillDownData || drillDownData.length === 0) return;
    
    const doc = new jsPDF('landscape', 'mm', 'a3');
    doc.setFontSize(16);
    doc.setTextColor(99, 102, 241);
    doc.text(drillDownTitle, 20, 15);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Total Records: ${drillDownData.length} | Generated: ${new Date().toLocaleString()}`, 20, 22);

    // Get all unique headers (excluding Branch)
    const headers = [...new Set(drillDownData.flatMap(row => Object.keys(row)))].filter(k => k !== 'Branch');

    autoTable(doc, {
      startY: 28,
      head: [headers.map(h => h.length > 15 ? h.substring(0, 15) + '..' : h)],
      body: drillDownData.map(row => 
        headers.map(h => {
          const value = row[h] || '-';
          return String(value).length > 20 ? String(value).substring(0, 20) + '..' : String(value);
        })
      ),
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241], fontSize: 6, cellPadding: 1 },
      styles: { fontSize: 6, cellPadding: 1 }
    });

    doc.save(`${drillDownTitle.toLowerCase().replace(/\s/g, '-')}.pdf`);
  };

  const getExecutivePerformance = () => {
    const executiveMap = {};
    salesData.forEach(record => {
      const exec = record['Executive Name'] || 'Unknown';
      if (!executiveMap[exec]) {
        executiveMap[exec] = { name: exec, sales: 0 };
      }
      executiveMap[exec].sales += 1;
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

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'];

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

  if (loading && salesData.length === 0) {
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
      <div className="flex-1 overflow-auto pt-16 lg:pt-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Sales Dashboard</h1>
              <p className="text-sm text-gray-500">
                <span className="font-medium text-indigo-600">{selectedBranch}</span> • Last sync: {lastSync ? lastSync.toLocaleTimeString() : 'Never'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${autoSyncEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <button onClick={() => setAutoSyncEnabled(!autoSyncEnabled)} className="text-xs text-gray-600 hover:text-indigo-700 focus:outline-none focus:text-indigo-700" style={{ cursor: 'pointer', backgroundColor: 'transparent' }}>
                  {autoSyncEnabled ? 'Auto' : 'Manual'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Branch Selector */}
          <Card className="p-4 bg-white rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Select Branch:</label>
              <Select value={selectedBranch} onValueChange={handleBranchSelect}>
                <SelectTrigger className="w-48 h-9 text-sm bg-white border-gray-200">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-[9999]">
                  <SelectItem value="all" className="cursor-pointer hover:bg-gray-100">
                    All Branch
                  </SelectItem>
                  {branches.map(branch => (
                    <SelectItem 
                      key={branch} 
                      value={branch}
                      className="cursor-pointer hover:bg-gray-100"
                    >
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

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
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Executive</label>
                <Select value={selectedExecutive} onValueChange={setSelectedExecutive}>
                  <SelectTrigger className="w-36 h-9 text-sm bg-white border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg z-[9999]">
                    <SelectItem value="all" className="cursor-pointer hover:bg-gray-100">All Executives</SelectItem>
                    {getExecutives().map(exec => (
                      <SelectItem key={exec} value={exec} className="cursor-pointer hover:bg-gray-100">{exec}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-32 h-9 text-sm bg-white border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg z-[9999]">
                    <SelectItem value="all" className="cursor-pointer hover:bg-gray-100">All Categories</SelectItem>
                    {getCategories().map(cat => (
                      <SelectItem key={cat} value={cat} className="cursor-pointer hover:bg-gray-100">{cat}</SelectItem>
                    ))}
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
                  setSelectedExecutive('all');
                  setSelectedCategory('all');
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
            <KPICard title="DC Collected" value={formatCurrency(stats.totalDCCollected)} icon={DollarSign} color="bg-orange-500" bgColor="bg-white" />
            <KPICard title="Discount" value={formatCurrency(stats.totalDiscountOperated)} icon={Target} color="bg-pink-500" bgColor="bg-white" />
          </div>

          {/* Sales Trend Chart */}
          <Card className="p-5 bg-white rounded-xl shadow-sm">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-gray-900">Sales Trend</h3>
              <p className="text-xs text-gray-500">Sales performance by executive over time</p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={salesTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                {getExecutives().slice(0, 5).map((exec, index) => (
                  <Line
                    key={exec}
                    type="monotone"
                    dataKey={exec}
                    name={exec.length > 10 ? exec.substring(0, 10) + '...' : exec}
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

          {/* Enquiry and Bookings Trend Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Enquiry Trend */}
            <Card className="p-5 bg-white rounded-xl shadow-sm">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-900">Enquiry Trend</h3>
                <p className="text-xs text-gray-500">Enquiries over time</p>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={enquiryTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="Count" name="Enquiries" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 5 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Bookings Trend */}
            <Card className="p-5 bg-white rounded-xl shadow-sm">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-900">Bookings Trend</h3>
                <p className="text-xs text-gray-500">Bookings over time</p>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={bookingsTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="Count" name="Bookings" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 5 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Bottom Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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

            {/* Executive Performance */}
            <Card className="p-4 bg-white rounded-xl shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Top Executives</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={getExecutivePerformance()} layout="vertical" margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={60} axisLine={false} tickLine={false} tickFormatter={(value) => value.length > 8 ? value.substring(0, 8) + '..' : value} />
                  <Tooltip formatter={(value) => [value, 'Sales']} cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} />
                  <Bar dataKey="sales" fill="#6366f1" radius={[0, 4, 4, 0]} style={{ cursor: 'pointer' }} onClick={(data) => handleExecutiveDrillDown(data.name)} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      </div>

      {/* Drill-down Modal */}
      {drillDownData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeDrillDown}>
          <Card className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{drillDownTitle}</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={exportDrillDownToCSV}>
                  <Download className="w-4 h-4 mr-1" /> CSV
                </Button>
                <Button size="sm" onClick={exportDrillDownToPDF} className="bg-indigo-600">
                  <FileDown className="w-4 h-4 mr-1" /> PDF
                </Button>
                <button onClick={closeDrillDown} className="p-1 hover:bg-gray-100 rounded" style={{ cursor: 'pointer' }}>
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-3 text-sm text-gray-500">{drillDownData.length} records</div>
            <div className="overflow-auto max-h-[60vh]">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {Object.keys(drillDownData[0] || {}).filter(k => k !== 'Branch').slice(0, 8).map((col, idx) => (
                      <th key={idx} className="text-left text-xs font-medium text-gray-500 uppercase py-2 px-3">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {drillDownData.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {Object.keys(drillDownData[0] || {}).filter(k => k !== 'Branch').slice(0, 8).map((col, colIdx) => (
                        <td key={colIdx} className="py-2 px-3 text-gray-700">{record[col] || '-'}</td>
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
