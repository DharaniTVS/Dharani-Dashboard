import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import FloatingAI from './FloatingAI';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, Filter, Download, ShoppingCart, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Bookings = ({ user, onLogout }) => {
  const [salesData, setSalesData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedExecutive, setSelectedExecutive] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [executives, setExecutives] = useState([]);

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
      fetchExecutives();
    }
  }, [selectedBranch]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedExecutive, startDate, endDate, salesData]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/sheets/bookings-data`, {
        params: { branch: selectedBranch }
      });
      setSalesData(response.data.data || []);
      setFilteredData(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExecutives = async () => {
    try {
      const response = await axios.get(`${API}/sheets/executives`, {
        params: { branch: selectedBranch }
      });
      setExecutives(response.data.executives || []);
    } catch (error) {
      console.error('Failed to fetch executives:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...salesData];

    // Search across all fields
    if (searchTerm) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(record => {
        return Object.values(record).some(value => 
          String(value || '').toLowerCase().includes(search)
        );
      });
    }

    if (selectedExecutive && selectedExecutive !== 'all') {
      filtered = filtered.filter(record => record['Executive'] === selectedExecutive);
    }

    // Date filter
    if (startDate && endDate) {
      filtered = filtered.filter(record => {
        const bookingDate = record['Booking Date'] || record['Date'] || '';
        if (bookingDate) {
          try {
            const recordDate = new Date(bookingDate);
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59);
            return recordDate >= start && recordDate <= end;
          } catch (e) {
            return true;
          }
        }
        return true;
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

  const exportToCSV = () => {
    if (!filteredData || filteredData.length === 0) {
      alert('No data to export');
      return;
    }
    
    // Get all unique headers from the data (excluding Branch)
    const allHeaders = [...new Set(filteredData.flatMap(row => Object.keys(row)))].filter(h => h !== 'Branch');
    
    const csvContent = [
      allHeaders.join(','),
      ...filteredData.map(row => 
        allHeaders.map(header => {
          const value = row[header] || '';
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${selectedBranch}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex bg-gray-50 min-h-screen" data-testid="bookings-page">
      <Sidebar user={user} onLogout={onLogout} />
      <FloatingAI />
      <div className="flex-1 overflow-auto pt-16 lg:pt-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Bookings - {selectedBranch}</h1>
                <p className="text-sm text-gray-600 mt-1">View vehicle bookings from {selectedBranch} branch</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="gap-2 text-gray-700 border-gray-300 hover:bg-gray-100"
              onClick={exportToCSV}
              data-testid="export-button"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="p-8">
          {/* Filters */}
          <Card className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    className="pl-10 bg-white text-gray-900 border-gray-300"
                    data-testid="search-input"
                  />
                </div>
              </div>

              {/* Executive Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Executive</label>
                <Select value={selectedExecutive} onValueChange={setSelectedExecutive}>
                  <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                    <SelectValue placeholder="All Executives" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all" className="text-gray-900 hover:bg-gray-100">All Executives</SelectItem>
                    {executives.map(exec => (
                      <SelectItem key={exec} value={exec} className="text-gray-900 hover:bg-gray-100">{exec}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reset Button */}
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={resetFilters}
                  className="w-full text-gray-700 border-gray-300 hover:bg-gray-100"
                  data-testid="reset-filters"
                >
                  Reset Filters
                </Button>
              </div>
            </div>

            {/* Date Range Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Start Date
                </label>
                <Input
                  type="date" style={{ color: "#1f2937" }}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white text-gray-900 border-gray-300"
                  data-testid="start-date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  End Date
                </label>
                <Input
                  type="date" style={{ color: "#1f2937" }}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white text-gray-900 border-gray-300"
                  data-testid="end-date"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredData.length}</span> bookings
              </p>
            </div>
          </Card>

          {/* Data Table */}
          <Card className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-600">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  Loading bookings...
                </div>
              ) : filteredData.length === 0 ? (
                <div className="p-8 text-center text-gray-600">No bookings found</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {/* Dynamic columns from data */}
                      {Object.keys(filteredData[0] || {}).filter(col => col !== 'Branch').map((column, idx) => (
                        <th 
                          key={idx}
                          className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-4 whitespace-nowrap"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredData.map((record, index) => (
                      <tr 
                        key={index} 
                        className="hover:bg-gray-50 transition-colors"
                        data-testid={`booking-row-${index}`}
                      >
                        {Object.keys(filteredData[0] || {}).filter(col => col !== 'Branch').map((column, colIdx) => (
                          <td 
                            key={colIdx}
                            className={`py-3 px-4 text-sm whitespace-nowrap ${
                              column.includes('Amount') || column.includes('₹') 
                                ? 'text-gray-900 font-medium' 
                                : 'text-gray-700'
                            }`}
                          >
                            {column === 'Payment Mode' ? (
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                record[column] === 'Cash' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                              }`}>
                                {record[column] || '-'}
                              </span>
                            ) : column.includes('Amount') ? (
                              `₹${record[column] || '-'}`
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
    </div>
  );
};

export default Bookings;
