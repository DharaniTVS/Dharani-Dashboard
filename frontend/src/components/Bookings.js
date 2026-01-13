import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import FloatingAI from './FloatingAI';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, Filter, Download, Plus, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Sales = ({ user, onLogout }) => {
  const [salesData, setSalesData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedExecutive, setSelectedExecutive] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [branches, setBranches] = useState([]);
  const [executives, setExecutives] = useState([]);

  useEffect(() => {
    fetchData();
    fetchFilters();
    
    // Listen for branch changes
    const handleBranchChange = (event) => {
      setSelectedBranch(event.detail);
    };
    
    window.addEventListener('branchChanged', handleBranchChange);
    
    // Initialize from localStorage
    const savedBranch = localStorage.getItem('selectedBranch');
    if (savedBranch) {
      setSelectedBranch(savedBranch);
    }
    
    return () => {
      window.removeEventListener('branchChanged', handleBranchChange);
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedBranch, selectedExecutive, startDate, endDate, salesData]);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API}/sheets/sales-data`);
      setSalesData(response.data.data || []);
      setFilteredData(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const [branchesRes, executivesRes] = await Promise.all([
        axios.get(`${API}/sheets/branches`),
        axios.get(`${API}/sheets/executives`)
      ]);
      setBranches(branchesRes.data.branches || []);
      setExecutives(executivesRes.data.executives || []);
    } catch (error) {
      console.error('Failed to fetch filters:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...salesData];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(record => 
        (record['Customer Name'] || '').toLowerCase().includes(search) ||
        (record['Mobile No'] || '').toLowerCase().includes(search) ||
        (record['Vehicle Model'] || '').toLowerCase().includes(search) ||
        (record['Customer ID'] || '').toLowerCase().includes(search)
      );
    }

    // Branch filter
    if (selectedBranch && selectedBranch !== 'all') {
      filtered = filtered.filter(record => record['Location'] === selectedBranch);
    }

    // Executive filter
    if (selectedExecutive && selectedExecutive !== 'all') {
      filtered = filtered.filter(record => record['Executive Name'] === selectedExecutive);
    }

    // Date filter
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
    setSelectedBranch('all');
    setSelectedExecutive('all');
    setStartDate('');
    setEndDate('');
  };

  const exportToCSV = () => {
    const headers = ['Customer ID', 'Customer Name', 'Mobile No', 'Vehicle Model', 'Executive Name', 'Location', 'Sales Date', 'Enquiry Type'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="flex bg-gray-50" data-testid="bookings-page">
      <Sidebar user={user} onLogout={onLogout} />
      <FloatingAI />
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bookings Management</h1>
              <p className="text-sm text-gray-600 mt-1">View and manage customer bookings</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={exportToCSV}
                data-testid="export-button"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
              <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4" />
                New Enquiry
              </Button>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Filters Section */}
          <Card className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by name, phone, model..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="search-input"
                  />
                </div>
              </div>

              {/* Branch Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger data-testid="branch-filter">
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map(branch => (
                      <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Executive Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Executive</label>
                <Select value={selectedExecutive} onValueChange={setSelectedExecutive}>
                  <SelectTrigger data-testid="executive-filter">
                    <SelectValue placeholder="All Executives" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Executives</SelectItem>
                    {executives.map(executive => (
                      <SelectItem key={executive} value={executive}>{executive}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="flex items-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={resetFilters}
                  className="w-full"
                  data-testid="reset-filters"
                >
                  Reset Filters
                </Button>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  data-testid="start-date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  data-testid="end-date"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredData.length}</span> of{' '}
                <span className="font-semibold text-gray-900">{salesData.length}</span> records
              </p>
            </div>
          </Card>

          {/* Data Table */}
          <Card className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-600">Loading sales data...</div>
              ) : filteredData.length === 0 ? (
                <div className="p-8 text-center text-gray-600">No records found</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-6">Customer ID</th>
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-6">Customer Name</th>
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-6">Mobile No</th>
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-6">Vehicle Model</th>
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-6">Executive</th>
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-6">Branch</th>
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-6">Sales Date</th>
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-6">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredData.map((record, index) => (
                      <tr 
                        key={index} 
                        className="hover:bg-gray-50 transition-colors"
                        data-testid={`sales-row-${index}`}
                      >
                        <td className="py-4 px-6 text-sm text-gray-900">{record['Customer ID'] || '-'}</td>
                        <td className="py-4 px-6 text-sm font-medium text-gray-900">{record['Customer Name'] || '-'}</td>
                        <td className="py-4 px-6 text-sm text-gray-600">{record['Mobile No'] || '-'}</td>
                        <td className="py-4 px-6 text-sm text-gray-900">{record['Vehicle Model'] || '-'}</td>
                        <td className="py-4 px-6 text-sm text-gray-600">{record['Executive Name'] || '-'}</td>
                        <td className="py-4 px-6 text-sm text-gray-600">{record['Location'] || '-'}</td>
                        <td className="py-4 px-6 text-sm text-gray-600">{record['Sales Date'] || '-'}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            record['Enquiry Type'] === 'Hot' ? 'bg-red-100 text-red-700' :
                            record['Enquiry Type'] === 'Warm' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {record['Enquiry Type'] || 'General'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Sales;
