import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import FloatingAI from './FloatingAI';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Wrench, Upload, FileText, Calendar, Search, Download } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Service = ({ user, onLogout }) => {
  const [serviceData, setServiceData] = useState([]);
  const [uploadedData, setUploadedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

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
      fetchServiceReports();
    }
  }, [selectedBranch, selectedDate]);

  const fetchServiceReports = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/service/reports`, {
        params: { branch: selectedBranch, date: selectedDate }
      });
      setUploadedData(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch service reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf')) {
      setMessage({ type: 'error', text: 'Please upload a PDF file' });
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
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      setUploadedData(response.data.data || []);
      setMessage({ type: 'success', text: `Successfully extracted ${response.data.data?.length || 0} records from ${file.name}` });
      
      // Refresh the data
      fetchServiceReports();
    } catch (error) {
      console.error('Failed to upload PDF:', error);
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to upload and process PDF' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const exportToCSV = () => {
    if (uploadedData.length === 0) return;

    const headers = ['SI No', 'Technician', 'Free', 'Paid', 'PSF', 'Major', 'Minor', 'Accident', 'PDI', 'Veh Tot', 'Parts Val', 'Bench work', 'Out Work', 'Water Work', 'Dealer Cat Work'];
    const csvContent = [
      headers.join(','),
      ...uploadedData.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `service-report-${selectedBranch}-${selectedDate}.csv`;
    a.click();
  };

  return (
    <div className="flex bg-gray-50 min-h-screen" data-testid="service-page">
      <Sidebar user={user} onLogout={onLogout} />
      <FloatingAI />
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wrench className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Service Reports - {selectedBranch}</h1>
                <p className="text-sm text-gray-600 mt-1">Upload S601 PDF reports and view technician productivity</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white text-gray-900 border-gray-300 w-40"
                data-testid="date-selector"
              />
              {uploadedData.length > 0 && (
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
          <Card className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Upload className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Upload S601 Service Report</h2>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
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
                <p className="text-gray-900 font-medium mb-2">
                  {uploading ? 'Processing...' : 'Click to upload S601 PDF'}
                </p>
                <p className="text-sm text-gray-600">
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
          <Card className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Technician Productivity - {selectedDate}
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-600">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  Loading service data...
                </div>
              ) : uploadedData.length === 0 ? (
                <div className="p-8 text-center text-gray-600">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="font-medium text-gray-900 mb-2">No data for this date</p>
                  <p className="text-sm">Upload an S601 PDF report to see technician productivity data</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-4">SI No</th>
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-4">Technician</th>
                      <th className="text-center text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-4">Free</th>
                      <th className="text-center text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-4">Paid</th>
                      <th className="text-center text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-4">PSF</th>
                      <th className="text-center text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-4">Major</th>
                      <th className="text-center text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-4">Minor</th>
                      <th className="text-center text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-4">Accident</th>
                      <th className="text-center text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-4">PDI</th>
                      <th className="text-center text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-4">Veh Tot</th>
                      <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-4">Parts Val</th>
                      <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-4">Bench Work</th>
                      <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-4">Out Work</th>
                      <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-4">Water Work</th>
                      <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-4">Dealer Cat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {uploadedData.map((record, index) => (
                      <tr 
                        key={index} 
                        className="hover:bg-gray-50 transition-colors"
                        data-testid={`service-row-${index}`}
                      >
                        <td className="py-3 px-4 text-sm text-gray-900">{record['SI No'] || '-'}</td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{record['Technician'] || '-'}</td>
                        <td className="py-3 px-4 text-sm text-center text-gray-600">{record['Free'] || '0'}</td>
                        <td className="py-3 px-4 text-sm text-center text-gray-600">{record['Paid'] || '0'}</td>
                        <td className="py-3 px-4 text-sm text-center text-gray-600">{record['PSF'] || '0'}</td>
                        <td className="py-3 px-4 text-sm text-center text-gray-600">{record['Major'] || '0'}</td>
                        <td className="py-3 px-4 text-sm text-center text-gray-600">{record['Minor'] || '0'}</td>
                        <td className="py-3 px-4 text-sm text-center text-gray-600">{record['Accident'] || '0'}</td>
                        <td className="py-3 px-4 text-sm text-center text-gray-600">{record['PDI'] || '0'}</td>
                        <td className="py-3 px-4 text-sm text-center font-medium text-indigo-600">{record['Veh Tot'] || '0'}</td>
                        <td className="py-3 px-4 text-sm text-right text-gray-900">₹{record['Parts Val'] || '0'}</td>
                        <td className="py-3 px-4 text-sm text-right text-gray-600">₹{record['Bench work'] || '0'}</td>
                        <td className="py-3 px-4 text-sm text-right text-gray-600">₹{record['Out Work'] || '0'}</td>
                        <td className="py-3 px-4 text-sm text-right text-gray-600">₹{record['Water Work'] || '0'}</td>
                        <td className="py-3 px-4 text-sm text-right text-gray-600">₹{record['Dealer Cat Work'] || '0'}</td>
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
