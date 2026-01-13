import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Trophy, Award, TrendingUp, Clock } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Analytics = ({ user, onLogout }) => {
  const [executives, setExecutives] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [execResponse, techResponse] = await Promise.all([
        axios.get(`${API}/sales/executives`),
        axios.get(`${API}/service/technicians`)
      ]);
      setExecutives(execResponse.data.executives || []);
      setTechnicians(techResponse.data.technicians || []);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-gray-50" data-testid="analytics-page">
      <Sidebar user={user} onLogout={onLogout} />
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics & Performance</h1>
            <p className="text-sm text-gray-600 mt-1">Detailed performance metrics across all branches</p>
          </div>
        </div>

        <div className="p-8">
          <Tabs defaultValue="sales" className="w-full">
            <TabsList className="bg-white border border-gray-200 p-1 rounded-xl mb-8">
              <TabsTrigger 
                value="sales" 
                className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg px-6 py-2.5"
                data-testid="sales-tab"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Sales Executives
              </TabsTrigger>
              <TabsTrigger 
                value="service"
                className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg px-6 py-2.5"
                data-testid="service-tab"
              >
                <Award className="w-4 h-4 mr-2" />
                Service Technicians
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sales">
              <Card className="bg-white rounded-xl border border-gray-200 overflow-hidden" data-testid="executives-table">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">Executive Performance</h2>
                  <p className="text-sm text-gray-600 mt-1">Track sales performance and conversion rates</p>
                </div>
                {loading ? (
                  <div className="p-6 text-gray-600">Loading...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-6">Name</th>
                          <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-6">Branch</th>
                          <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-6">Bookings</th>
                          <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-6">Deliveries</th>
                          <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-6">Conversion</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {executives.map((exec, index) => (
                          <tr
                            key={exec.executive_id}
                            className="hover:bg-gray-50 transition-colors"
                            data-testid={`executive-row-${index}`}
                          >
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold">
                                  {exec.name.charAt(0)}
                                </div>
                                <span className="text-sm font-medium text-gray-900">{exec.name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-600">{exec.branch}</td>
                            <td className="py-4 px-6 text-sm font-semibold text-gray-900 text-right">{exec.bookings}</td>
                            <td className="py-4 px-6 text-sm font-semibold text-gray-900 text-right">{exec.deliveries}</td>
                            <td className="py-4 px-6 text-right">
                              <div className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                                <TrendingUp className="w-3 h-3" />
                                {exec.conversion_rate}%
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="service">
              <Card className="bg-white rounded-xl border border-gray-200 overflow-hidden" data-testid="technicians-table">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900">Technician Performance</h2>
                  <p className="text-sm text-gray-600 mt-1">Service job completion and efficiency metrics</p>
                </div>
                {loading ? (
                  <div className="p-6 text-gray-600">Loading...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-6">Name</th>
                          <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-6">Branch</th>
                          <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-6">Completed</th>
                          <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-6">Pending</th>
                          <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-6">Avg Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {technicians.map((tech, index) => (
                          <tr
                            key={tech.technician_id}
                            className="hover:bg-gray-50 transition-colors"
                            data-testid={`technician-row-${index}`}
                          >
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">
                                  {tech.name.charAt(0)}
                                </div>
                                <span className="text-sm font-medium text-gray-900">{tech.name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-600">{tech.branch}</td>
                            <td className="py-4 px-6 text-sm font-semibold text-gray-900 text-right">{tech.jobs_completed}</td>
                            <td className="py-4 px-6 text-right">
                              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                                tech.jobs_pending > 5 
                                  ? 'bg-orange-100 text-orange-700' 
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {tech.jobs_pending}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="inline-flex items-center gap-1 text-sm font-medium text-gray-700">
                                <Clock className="w-3 h-3" />
                                {tech.avg_time}h
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Analytics;