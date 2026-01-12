import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { Card } from './ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = ({ user, onLogout }) => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/overview`);
      setOverview(response.data);
    } catch (error) {
      console.error('Failed to fetch overview:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar user={user} onLogout={onLogout} />
        <div className="flex-1 p-8 bg-slate-950 min-h-screen">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex" data-testid="dashboard">
      <Sidebar user={user} onLogout={onLogout} />
      <div className="flex-1 p-8 bg-slate-950 min-h-screen overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Multi-Branch Dashboard</h1>
            <p className="text-gray-400">Real-time overview of all 5 branches</p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 p-6" data-testid="total-branches-card">
              <div className="text-blue-100 text-sm font-medium mb-2">Total Branches</div>
              <div className="text-white text-4xl font-bold">{overview?.total_branches || 5}</div>
            </Card>

            <Card className="bg-gradient-to-br from-green-600 to-green-700 border-0 p-6" data-testid="service-jobs-card">
              <div className="text-green-100 text-sm font-medium mb-2">Service Jobs</div>
              <div className="text-white text-4xl font-bold">{overview?.service_stats?.total_jobs || 0}</div>
              <div className="text-green-100 text-xs mt-1">
                {overview?.service_stats?.completed || 0} completed
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-purple-600 to-purple-700 border-0 p-6" data-testid="finance-cases-card">
              <div className="text-purple-100 text-sm font-medium mb-2">Finance Cases</div>
              <div className="text-white text-4xl font-bold">{overview?.finance_stats?.total_cases || 0}</div>
              <div className="text-purple-100 text-xs mt-1">
                {overview?.finance_stats?.approved || 0} approved
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-orange-600 to-orange-700 border-0 p-6" data-testid="pending-cases-card">
              <div className="text-orange-100 text-sm font-medium mb-2">Pending</div>
              <div className="text-white text-4xl font-bold">
                {(overview?.finance_stats?.pending || 0) + (overview?.service_stats?.pending || 0)}
              </div>
              <div className="text-orange-100 text-xs mt-1">Requires attention</div>
            </Card>
          </div>

          {/* Branch Performance */}
          <Card className="bg-slate-900/50 backdrop-blur border-slate-700 p-6 mb-8" data-testid="branch-performance-chart">
            <h2 className="text-xl font-bold text-white mb-6">Branch-wise Performance</h2>
            {overview?.branches && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={overview.branches}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="branch_name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="bookings" fill="#3b82f6" name="Bookings" />
                  <Bar dataKey="deliveries" fill="#10b981" name="Deliveries" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Branch Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {overview?.branches?.map((branch) => (
              <Card
                key={branch.branch_id}
                className="bg-slate-900/50 backdrop-blur border-slate-700 p-6 hover:border-blue-500 transition-all duration-200"
                data-testid={`branch-card-${branch.branch_id}`}
              >
                <h3 className="text-lg font-bold text-white mb-4">{branch.branch_name}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bookings</span>
                    <span className="text-white font-semibold">{branch.bookings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Deliveries</span>
                    <span className="text-white font-semibold">{branch.deliveries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Revenue</span>
                    <span className="text-white font-semibold">
                      ₹{(branch.revenue / 100000).toFixed(2)}L
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {overview?.demo_mode && (
            <div className="mt-6 bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
              <p className="text-yellow-400 text-sm">
                ⚠️ Demo Mode: Connect your Google Sheets for live data
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;