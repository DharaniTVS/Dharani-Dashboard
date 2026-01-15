import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import FloatingAI from './FloatingAI';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Package, Search, Download, RefreshCw } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Inventory = ({ user, onLogout }) => {
  const [stockData, setStockData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

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
      fetchStockData();
    }
  }, [selectedBranch]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, stockData]);

  const fetchStockData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/sheets/stock-data`, {
        params: { branch: selectedBranch }
      });
      setStockData(response.data.data || []);
      setFilteredData(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...stockData];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(record => 
        Object.values(record).some(value => 
          String(value).toLowerCase().includes(search)
        )
      );
    }

    setFilteredData(filtered);
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) return;

    const headers = Object.keys(filteredData[0] || {});
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
    a.download = `inventory-${selectedBranch}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Get column headers dynamically from data
  const getColumns = () => {
    if (filteredData.length === 0) return [];
    return Object.keys(filteredData[0]).filter(key => key !== 'Branch');
  };

  return (
    <div className="flex bg-gray-50 min-h-screen" data-testid="inventory-page">
      <Sidebar user={user} onLogout={onLogout} />
      <FloatingAI />
      <div className="flex-1 overflow-auto pt-16 lg:pt-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Inventory - {selectedBranch}</h1>
                <p className="text-sm text-gray-600 mt-1">View stock data from {selectedBranch} branch</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="gap-2 text-gray-700 border-gray-300 hover:bg-gray-100"
                onClick={fetchStockData}
                data-testid="refresh-button"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              {filteredData.length > 0 && (
                <Button 
                  variant="outline" 
                  className="gap-2 text-gray-700 border-gray-300 hover:bg-gray-100"
                  onClick={exportToCSV}
                  data-testid="export-button"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Search */}
          <Card className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search inventory..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white text-gray-900 border-gray-300"
                  data-testid="search-input"
                />
              </div>
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredData.length}</span> items
              </p>
            </div>
          </Card>

          {/* Data Table */}
          <Card className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-600">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  Loading inventory data...
                </div>
              ) : filteredData.length === 0 ? (
                <div className="p-8 text-center text-gray-600">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="font-medium text-gray-900 mb-2">No inventory data found</p>
                  <p className="text-sm">The Stock sheet for {selectedBranch} branch may be empty or not configured.</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {getColumns().map((column, index) => (
                        <th 
                          key={index}
                          className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-6"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredData.map((record, rowIndex) => (
                      <tr 
                        key={rowIndex} 
                        className="hover:bg-gray-50 transition-colors"
                        data-testid={`inventory-row-${rowIndex}`}
                      >
                        {getColumns().map((column, colIndex) => (
                          <td 
                            key={colIndex}
                            className="py-4 px-6 text-sm text-gray-900"
                          >
                            {record[column] || '-'}
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

export default Inventory;
