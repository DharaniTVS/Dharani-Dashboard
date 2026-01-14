import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import FloatingAI from './FloatingAI';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, Filter, Download, Calendar, RefreshCw, FileDown, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Sales = ({ user, onLogout }) => {
  const [salesData, setSalesData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedExecutive, setSelectedExecutive] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [executives, setExecutives] = useState([]);
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
    
    return () => {
      window.removeEventListener('branchChanged', handleBranchChange);
    };
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/sheets/sales-data`, {
        params: { branch: selectedBranch }
      });
      setSalesData(response.data.data || []);
      setFilteredData(response.data.data || []);
      setLastSync(new Date());
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedBranch]);

  const fetchExecutives = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/sheets/executives`, {
        params: { branch: selectedBranch }
      });
      setExecutives(response.data.executives || []);
    } catch (error) {
      console.error('Failed to fetch executives:', error);
    }
  }, [selectedBranch]);

  useEffect(() => {
    if (selectedBranch) {
      fetchData();
      fetchExecutives();
    }
  }, [selectedBranch, fetchData, fetchExecutives]);

  // Auto-sync every 30 seconds
  useEffect(() => {
    if (!autoSyncEnabled) return;
    
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoSyncEnabled, fetchData]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedExecutive, startDate, endDate, salesData]);

  const applyFilters = () => {
    let filtered = [...salesData];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(record => 
        (record['Customer Name'] || '').toLowerCase().includes(search) ||
        (record['Mobile No'] || '').toLowerCase().includes(search) ||
        (record['Vehicle Model'] || '').toLowerCase().includes(search)
      );
    }

    if (selectedExecutive && selectedExecutive !== 'all') {
      filtered = filtered.filter(record => record['Executive Name'] === selectedExecutive);
    }

    if (startDate && endDate) {
      filtered = filtered.filter(record => {
        const saleDate = record['Sales Date'] || '';
        return saleDate >= startDate && saleDate <= endDate;
      });
    }

    setFilteredData(filtered);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedExecutive('all');
    setStartDate('');
    setEndDate('');
  };

  // Drill-down function - filter by executive
  const handleDrillDown = (executive) => {
    const data = salesData.filter(record => record['Executive Name'] === executive);
    setDrillDownData(data);
    setDrillDownTitle(`Sales by ${executive}`);
  };

  const closeDrillDown = () => {
    setDrillDownData(null);
    setDrillDownTitle('');
  };

  const exportToCSV = (data = filteredData, filename = 'sales') => {
    const headers = ['Sales Date', 'Customer Name', 'Mobile No', 'Vehicle Model', 'Category', 'Executive Name', 'Vehicle Cost (₹)', 'Cash/HP', 'Financier Name'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || Object.entries(row).find(([k]) => k.toLowerCase().includes(header.toLowerCase().split(' ')[0]))?.[1] || '';
          return `"${value}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${selectedBranch}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportToPDF = (data = filteredData, title = 'Sold Vehicles') => {
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(18);
    doc.setTextColor(99, 102, 241);
    doc.text(`${title} - ${selectedBranch}`, 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Date Range: ${startDate || 'All'} to ${endDate || 'All'}`, 20, 28);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 34);
    doc.text(`Total Records: ${data.length}`, 20, 40);

    const headers = ['Date', 'Customer', 'Phone', 'Model', 'Category', 'Executive', 'Cost', 'Payment'];
    
    doc.autoTable({
      startY: 46,
      head: [headers],
      body: data.map(row => [
        row['Sales Date'] || '-',
        (row['Customer Name'] || '-').substring(0, 20),
        row['Mobile No'] || '-',
        (row['Vehicle Model'] || '-').substring(0, 15),
        row['Category'] || '-',
        (row['Executive Name'] || '-').substring(0, 12),
        row['Vehicle Cost (₹)'] || Object.entries(row).find(([k]) => k.toLowerCase().includes('vehicle cost'))?.[1] || '-',
        row['Cash/HP'] || '-'
      ]),
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
      styles: { fontSize: 8, cellPadding: 2 }
    });

    doc.save(`${title.toLowerCase().replace(/\s/g, '-')}-${selectedBranch}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="flex bg-gray-50 dark:bg-slate-900 min-h-screen" data-testid="sales-page">
      <Sidebar user={user} onLogout={onLogout} />
      <FloatingAI />
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sold Vehicles - {selectedBranch}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Completed sales • Last sync: {lastSync ? lastSync.toLocaleTimeString() : 'Never'}
                {loading && <span className="ml-2 text-indigo-600">Syncing...</span>}
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
              <Button 
                variant="outline" 
                className="gap-2 text-gray-600"
                onClick={() => exportToCSV()}
              >
                <Download className="w-4 h-4" />
                CSV
              </Button>
              <Button 
                className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                onClick={() => exportToPDF()}
              >
                <FileDown className="w-4 h-4" />
                PDF
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
              className="text-xs text-indigo-600 hover:underline"
            >
              {autoSyncEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>

        <div className="p-8">
          {/* Filters Section */}
          <Card className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by name, phone, model..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white dark:bg-slate-700 text-gray-900 dark:text-white border-gray-300 dark:border-slate-600"
                    data-testid="search-input"
                  />
                </div>
              </div>

              {/* Executive Filter - Clickable for drill-down */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Executive</label>
                <Select value={selectedExecutive} onValueChange={setSelectedExecutive}>
                  <SelectTrigger className="bg-white dark:bg-slate-700 text-gray-900 dark:text-white border-gray-300 dark:border-slate-600">
                    <SelectValue placeholder="All Executives" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-700">
                    <SelectItem value="all" className="text-gray-900 dark:text-white">All Executives</SelectItem>
                    {executives.map(executive => (
                      <SelectItem key={executive} value={executive} className="text-gray-900 dark:text-white">{executive}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reset Button */}
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={resetFilters}
                  className="w-full text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-600"
                >
                  Reset Filters
                </Button>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white text-gray-900 border-gray-300 [color-scheme:light]"
                  style={{ color: '#1f2937' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  End Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white text-gray-900 border-gray-300 [color-scheme:light]"
                  style={{ color: '#1f2937' }}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing <span className="font-semibold text-gray-900 dark:text-white">{filteredData.length}</span> of{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{salesData.length}</span> records
              </p>
            </div>
          </Card>

          {/* Data Table */}
          <Card className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-600 dark:text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  Loading sales data...
                </div>
              ) : filteredData.length === 0 ? (
                <div className="p-8 text-center text-gray-600 dark:text-gray-400">No records found</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                    <tr>
                      {/* Dynamic columns from data */}
                      {Object.keys(filteredData[0] || {}).filter(col => col !== 'Branch').map((column, idx) => (
                        <th 
                          key={idx}
                          className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider py-3 px-4 whitespace-nowrap"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-600">
                    {filteredData.map((record, index) => (
                      <tr 
                        key={index} 
                        className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                        data-testid={`sales-row-${index}`}
                      >
                        {Object.keys(filteredData[0] || {}).filter(col => col !== 'Branch').map((column, colIdx) => (
                          <td 
                            key={colIdx}
                            className={`py-3 px-4 text-sm whitespace-nowrap ${
                              column === 'Executive Name' 
                                ? 'text-indigo-600 hover:text-indigo-800 cursor-pointer hover:underline' 
                                : column.includes('Cost') || column.includes('₹') || column.includes('Value') || column.includes('Charges') || column.includes('DD') || column.includes('Balance') || column.includes('Downpayment')
                                  ? 'text-gray-900 dark:text-white font-medium'
                                  : 'text-gray-700 dark:text-gray-300'
                            }`}
                            onClick={column === 'Executive Name' ? () => handleDrillDown(record[column]) : undefined}
                          >
                            {column === 'Category' ? (
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                record[column] === 'Sports' ? 'bg-red-100 text-red-700' :
                                record[column] === 'Scooter' ? 'bg-blue-100 text-blue-700' :
                                record[column] === 'EV' ? 'bg-green-100 text-green-700' :
                                record[column] === 'Moped' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {record[column] || '-'}
                              </span>
                            ) : column === 'Cash/HP' ? (
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                record[column] === 'Cash' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                              }`}>
                                {record[column] || '-'}
                              </span>
                            ) : column === 'Invoice Status' || column === 'Exchange Vehicle Sold Status' ? (
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                record[column]?.toLowerCase() === 'done' || record[column]?.toLowerCase() === 'sold' 
                                  ? 'bg-green-100 text-green-700' 
                                  : record[column]?.toLowerCase() === 'pending' 
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-700'
                              }`}>
                                {record[column] || '-'}
                              </span>
                            ) : (
                              record[column] || '-'
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Drill-down Modal */}
      {drillDownData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="bg-white dark:bg-slate-800 rounded-2xl max-w-5xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{drillDownTitle}</h3>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportToCSV(drillDownData, drillDownTitle.toLowerCase().replace(/\s/g, '-'))}
                >
                  <Download className="w-4 h-4 mr-1" /> CSV
                </Button>
                <Button 
                  size="sm"
                  onClick={() => exportToPDF(drillDownData, drillDownTitle)}
                  className="bg-indigo-600"
                >
                  <FileDown className="w-4 h-4 mr-1" /> PDF
                </Button>
                <button onClick={closeDrillDown} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-4 text-sm text-gray-600 dark:text-gray-400">
              {drillDownData.length} records found
            </div>
            <div className="overflow-auto max-h-[60vh]">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700 sticky top-0">
                  <tr>
                    <th className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase py-3 px-4">Date</th>
                    <th className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase py-3 px-4">Customer</th>
                    <th className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase py-3 px-4">Phone</th>
                    <th className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase py-3 px-4">Model</th>
                    <th className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase py-3 px-4">Category</th>
                    <th className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase py-3 px-4">Cost</th>
                    <th className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase py-3 px-4">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-600">
                  {drillDownData.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{record['Sales Date'] || '-'}</td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{record['Customer Name'] || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{record['Mobile No'] || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{record['Vehicle Model'] || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{record['Category'] || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                        ₹{record['Vehicle Cost (₹)'] || Object.entries(record).find(([k]) => k.toLowerCase().includes('vehicle cost'))?.[1] || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{record['Cash/HP'] || '-'}</td>
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

export default Sales;
