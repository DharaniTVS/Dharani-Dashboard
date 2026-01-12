import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

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
    <div className="flex" data-testid="analytics-page">
      <Sidebar user={user} onLogout={onLogout} />
      <div className="flex-1 p-8 bg-slate-950 min-h-screen overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Analytics & Performance</h1>
            <p className="text-gray-400">Detailed performance metrics</p>
          </div>

          <Tabs defaultValue="sales" className="w-full">
            <TabsList className="bg-slate-900 border-slate-700 mb-6">
              <TabsTrigger value="sales" data-testid="sales-tab">Sales Executives</TabsTrigger>
              <TabsTrigger value="service" data-testid="service-tab">Service Technicians</TabsTrigger>
            </TabsList>

            <TabsContent value="sales">
              <Card className="bg-slate-900/50 backdrop-blur border-slate-700 p-6" data-testid="executives-table">
                <h2 className="text-xl font-bold text-white mb-6">Executive Performance</h2>
                {loading ? (
                  <div className="text-gray-400">Loading...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left text-gray-400 font-medium py-3 px-4">Name</th>
                          <th className="text-left text-gray-400 font-medium py-3 px-4">Branch</th>
                          <th className="text-right text-gray-400 font-medium py-3 px-4">Bookings</th>
                          <th className="text-right text-gray-400 font-medium py-3 px-4">Deliveries</th>
                          <th className="text-right text-gray-400 font-medium py-3 px-4">Conversion %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {executives.map((exec, index) => (
                          <tr
                            key={exec.executive_id}
                            className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                            data-testid={`executive-row-${index}`}
                          >
                            <td className="text-white py-4 px-4">{exec.name}</td>
                            <td className="text-gray-400 py-4 px-4">{exec.branch}</td>
                            <td className="text-white text-right py-4 px-4">{exec.bookings}</td>
                            <td className="text-white text-right py-4 px-4">{exec.deliveries}</td>
                            <td className="text-right py-4 px-4">
                              <span className="text-green-400 font-semibold">{exec.conversion_rate}%</span>
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
              <Card className="bg-slate-900/50 backdrop-blur border-slate-700 p-6" data-testid="technicians-table">
                <h2 className="text-xl font-bold text-white mb-6">Technician Performance</h2>
                {loading ? (
                  <div className="text-gray-400">Loading...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left text-gray-400 font-medium py-3 px-4">Name</th>
                          <th className="text-left text-gray-400 font-medium py-3 px-4">Branch</th>
                          <th className="text-right text-gray-400 font-medium py-3 px-4">Completed</th>
                          <th className="text-right text-gray-400 font-medium py-3 px-4">Pending</th>
                          <th className="text-right text-gray-400 font-medium py-3 px-4">Avg Time (hrs)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {technicians.map((tech, index) => (
                          <tr
                            key={tech.technician_id}
                            className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                            data-testid={`technician-row-${index}`}
                          >
                            <td className="text-white py-4 px-4">{tech.name}</td>
                            <td className="text-gray-400 py-4 px-4">{tech.branch}</td>
                            <td className="text-white text-right py-4 px-4">{tech.jobs_completed}</td>
                            <td className="text-right py-4 px-4">
                              <span className={tech.jobs_pending > 5 ? 'text-orange-400' : 'text-gray-400'}>
                                {tech.jobs_pending}
                              </span>
                            </td>
                            <td className="text-gray-400 text-right py-4 px-4">{tech.avg_time}</td>
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