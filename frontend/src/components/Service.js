import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import FloatingAI from './FloatingAI';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Wrench, Upload, FileText, Calendar, Search, Download, RefreshCw, FileDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Service = ({ user, onLogout }) => {
  const [uploadedData, setUploadedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);
  const branches = ['Kumarapalayam', 'Kavindapadi', 'Ammapettai', 'Anthiyur', 'Bhavani'];

  useEffect(() => {
    const savedBranch = localStorage.getItem('selectedBranch') || 'Kumarapalayam';
    setSelectedBranch(savedBranch);
    
    // Set default dates (last 7 days)
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(weekAgo.toISOString().split('T')[0]);

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

  const fetchServiceReports = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/service/reports`, {
        params: { branch: selectedBranch }
      });
      setUploadedData(response.data.data || []);
      setLastSync(new Date());
    } catch (error) {
      console.error('Failed to fetch service reports:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedBranch]);

  useEffect(() => {
    if (selectedBranch) {
      fetchServiceReports();
    }
  }, [selectedBranch, fetchServiceReports]);

  // Auto-sync every 30 seconds
  useEffect(() => {
    if (!autoSyncEnabled) return;
    
    const interval = setInterval(() => {
      fetchServiceReports();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoSyncEnabled, fetchServiceReports]);

  // Filter data by date
  const filteredData = uploadedData.filter(record => {
    if (!startDate || !endDate) return true;
    const recordDate = record.date || '';
    return recordDate >= startDate && recordDate <= endDate;
  });

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setMessage({ type: 'error', text: 'Please upload a PDF file' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(
        `${API}/service/upload-pdf?branch=${encodeURIComponent(selectedBranch)}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000
        }
      );

      setMessage({ type: 'success', text: `✅ Successfully extracted ${response.data.data?.length || 0} records from ${file.name}` });
      
      // Refresh the data
      fetchServiceReports();
    } catch (error) {
      console.error('Failed to upload PDF:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to upload and process PDF';
      setMessage({ type: 'error', text: `❌ ${errorMsg}` });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) return;

    const headers = ['Date', 'SI No', 'Technician', 'Free', 'Paid', 'PSF', 'Major', 'Minor', 'Accident', 'PDI', 'Veh Tot', 'Parts Val', 'Bench work', 'Out Work', 'Water Work', 'Dealer Cat Work'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        headers.map(header => `"${row[header] || row[header.toLowerCase()] || ''}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `service-report-${selectedBranch}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportToPDF = () => {
    if (filteredData.length === 0) return;

    const doc = new jsPDF('landscape');
    
    doc.setFontSize(18);
    doc.setTextColor(99, 102, 241);
    doc.text(`Service Report - ${selectedBranch}`, 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Date Range: ${startDate || 'All'} to ${endDate || 'All'}`, 20, 28);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 34);

    const headers = ['SI No', 'Technician', 'Free', 'Paid', 'PSF', 'Major', 'Minor', 'Accident', 'PDI', 'Veh Tot', 'Parts Val'];
    
    autoTable(doc, {
      startY: 40,
      head: [headers],
      body: filteredData.map(row => headers.map(h => row[h] || '-')),
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
      styles: { fontSize: 8 }
    });

    doc.save(`service-report-${selectedBranch}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="flex bg-gray-50 dark:bg-slate-900 min-h-screen" data-testid="service-page">
      <Sidebar user={user} onLogout={onLogout} />
      <FloatingAI />
      <div className="flex-1 overflow-auto pt-16 lg:pt-0">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wrench className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Service Reports - {selectedBranch}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Upload S601 PDF reports • Last sync: {lastSync ? lastSync.toLocaleTimeString() : 'Never'}
                  {loading && <span className="ml-2 text-indigo-600">Syncing...</span>}
                </p>
              </div>
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
                  data-testid="start-date"
                />
                <span className="text-gray-400">-</span>
                <Input
                  type="date" style={{ color: "#1f2937" }}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-36 h-9 text-sm bg-white dark:bg-slate-700"
                  data-testid="end-date"
                />
              </div>
              <Button 
                variant="outline" 
                className="gap-2 text-gray-600"
                onClick={fetchServiceReports}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {filteredData.length > 0 && (
                <>
                  <Button 
                    variant="outline" 
                    className="gap-2 text-gray-600"
                    onClick={exportToCSV}
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </Button>
                  <Button 
                    className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                    onClick={exportToPDF}
                  >
                    <FileDown className="w-4 h-4" />
                    PDF
                  </Button>
                </>
              )}
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
          {/* Branch Selector */}
          <Card className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 mb-6">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Branch:</label>
              <Select value={selectedBranch} onValueChange={handleBranchSelect}>
                <SelectTrigger className="w-48 h-9 text-sm bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 shadow-lg z-[9999]">
                  {branches.map(branch => (
                    <SelectItem 
                      key={branch} 
                      value={branch}
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-900 dark:text-white"
                    >
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Message */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
              'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          {/* Upload Section */}
          <Card className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Upload className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upload S601 Service Report</h2>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="pdf-upload"
                data-testid="pdf-upload"
              />
              <label 
                htmlFor="pdf-upload" 
                className="cursor-pointer"
              >
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-900 dark:text-white font-medium mb-2">
                  {uploading ? 'Processing PDF...' : 'Click to upload S601 PDF'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload daily service advisor/technician productivity report
                </p>
              </label>
              
              {uploading && (
                <div className="mt-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Extracting data from PDF...</p>
                </div>
              )}
            </div>
          </Card>

          {/* Data Table */}
          <Card className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Technician Productivity
              </h3>
              <span className="text-sm text-gray-500">
                {filteredData.length} records
              </span>
            </div>
            
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-600">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  Loading service data...
                </div>
              ) : filteredData.length === 0 ? (
                <div className="p-8 text-center text-gray-600 dark:text-gray-400">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="font-medium text-gray-900 dark:text-white mb-2">No data found</p>
                  <p className="text-sm">Upload an S601 PDF report to see technician productivity data</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                    <tr>
                      <th className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider py-3 px-4">Date</th>
                      <th className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider py-3 px-4">SI No</th>
                      <th className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider py-3 px-4">Technician</th>
                      <th className="text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider py-3 px-4">Free</th>
                      <th className="text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider py-3 px-4">Paid</th>
                      <th className="text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider py-3 px-4">PSF</th>
                      <th className="text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider py-3 px-4">Major</th>
                      <th className="text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider py-3 px-4">Minor</th>
                      <th className="text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider py-3 px-4">Veh Tot</th>
                      <th className="text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider py-3 px-4">Parts Val</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-600">
                    {filteredData.map((record, index) => (
                      <tr 
                        key={index} 
                        className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                        data-testid={`service-row-${index}`}
                      >
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{record.date || '-'}</td>
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{record['SI No'] || '-'}</td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{record['Technician'] || '-'}</td>
                        <td className="py-3 px-4 text-sm text-center text-gray-600 dark:text-gray-300">{record['Free'] || '0'}</td>
                        <td className="py-3 px-4 text-sm text-center text-gray-600 dark:text-gray-300">{record['Paid'] || '0'}</td>
                        <td className="py-3 px-4 text-sm text-center text-gray-600 dark:text-gray-300">{record['PSF'] || '0'}</td>
                        <td className="py-3 px-4 text-sm text-center text-gray-600 dark:text-gray-300">{record['Major'] || '0'}</td>
                        <td className="py-3 px-4 text-sm text-center text-gray-600 dark:text-gray-300">{record['Minor'] || '0'}</td>
                        <td className="py-3 px-4 text-sm text-center font-medium text-indigo-600">{record['Veh Tot'] || '0'}</td>
                        <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-white">₹{record['Parts Val'] || '0'}</td>
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

export default Service;
