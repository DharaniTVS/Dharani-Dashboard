import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import FloatingAI from './FloatingAI';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Wrench, Clock, CheckCircle, AlertCircle, User, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Service = ({ user, onLogout }) => {
  const [technicians, setTechnicians] = useState([]);
  const [serviceStats, setServiceStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [techResponse, overviewResponse] = await Promise.all([
        axios.get(`${API}/service/technicians`),
        axios.get(`${API}/dashboard/overview`)
      ]);
      setTechnicians(techResponse.data.technicians || []);
      setServiceStats(overviewResponse.data.service_stats || {});
    } catch (error) {
      console.error('Failed to fetch service data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <Card className="p-6 bg-white rounded-xl border border-gray-200 card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="flex bg-gray-50" data-testid="service-page">
      <Sidebar user={user} onLogout={onLogout} />
      <FloatingAI />
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Service Management</h1>
              <p className="text-sm text-gray-600 mt-1">Track service jobs, technicians, and workshop performance</p>
            </div>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              New Job Card
            </Button>
          </div>
        </div>

        <div className="p-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Jobs"
              value={serviceStats?.total_jobs || 0}
              icon={Wrench}
              color="bg-gradient-to-br from-blue-500 to-blue-600"
              subtitle="All time"
            />
            <StatCard
              title="Completed"
              value={serviceStats?.completed || 0}
              icon={CheckCircle}
              color="bg-gradient-to-br from-green-500 to-green-600"
              subtitle="Successfully finished"
            />
            <StatCard
              title="Pending"
              value={serviceStats?.pending || 0}
              icon={Clock}
              color="bg-gradient-to-br from-orange-500 to-orange-600"
              subtitle="In progress"
            />
            <StatCard
              title="Efficiency"
              value={serviceStats?.total_jobs > 0 ? `${Math.round((serviceStats?.completed || 0) / serviceStats.total_jobs * 100)}%` : '0%'}
              icon={TrendingUp}
              color="bg-gradient-to-br from-purple-500 to-purple-600"
              subtitle="Completion rate"
            />
          </div>

          {/* Technicians Performance */}
          <Card className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Technician Performance</h2>
              <p className="text-sm text-gray-600 mt-1">Track individual technician productivity and workload</p>
            </div>
            {loading ? (
              <div className="p-6 text-gray-600">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-6">Technician</th>
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-6">Branch</th>
                      <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-6">Completed</th>
                      <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-6">Pending</th>
                      <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-6">Avg Time</th>
                      <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-6">Status</th>
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
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
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
                        <td className="py-4 px-6 text-right">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            tech.jobs_pending > 8
                              ? 'bg-red-100 text-red-700'
                              : tech.jobs_pending > 4
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {tech.jobs_pending > 8 ? 'Overloaded' : tech.jobs_pending > 4 ? 'Busy' : 'Available'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Service;