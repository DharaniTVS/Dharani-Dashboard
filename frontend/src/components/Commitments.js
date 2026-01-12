import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { Card } from './ui/card';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Commitments = ({ user, onLogout }) => {
  const [commitments, setCommitments] = useState({ sales: [], service: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommitments();
  }, []);

  const fetchCommitments = async () => {
    try {
      const response = await axios.get(`${API}/commitments/today`);
      setCommitments(response.data);
    } catch (error) {
      console.error('Failed to fetch commitments:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex" data-testid="commitments-page">
      <Sidebar user={user} onLogout={onLogout} />
      <div className="flex-1 p-8 bg-slate-950 min-h-screen overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Daily Commitments</h1>
            <p className="text-gray-400">Track daily commitments vs actual performance</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Commitments */}
            <Card className="bg-slate-900/50 backdrop-blur border-slate-700 p-6" data-testid="sales-commitments">
              <h2 className="text-xl font-bold text-white mb-6">Sales Commitments</h2>
              {loading ? (
                <div className="text-gray-400">Loading...</div>
              ) : commitments.sales.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>No sales commitments for today</p>
                  <p className="text-sm mt-2">WhatsApp agent will collect commitments automatically</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {commitments.sales.map((commit, index) => (
                    <div
                      key={index}
                      className="bg-slate-800 p-4 rounded-lg"
                      data-testid={`sales-commitment-${index}`}
                    >
                      <div className="font-semibold text-white mb-2">{commit.executive_name}</div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <div className="text-gray-400">Bookings</div>
                          <div className="text-white">{commit.bookings_planned} / {commit.bookings_actual}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Deliveries</div>
                          <div className="text-white">{commit.deliveries_planned} / {commit.deliveries_actual}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Follow-ups</div>
                          <div className="text-white">{commit.follow_ups_planned} / {commit.follow_ups_actual}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Service Commitments */}
            <Card className="bg-slate-900/50 backdrop-blur border-slate-700 p-6" data-testid="service-commitments">
              <h2 className="text-xl font-bold text-white mb-6">Service Commitments</h2>
              {loading ? (
                <div className="text-gray-400">Loading...</div>
              ) : commitments.service.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>No service commitments for today</p>
                  <p className="text-sm mt-2">WhatsApp agent will collect commitments automatically</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {commitments.service.map((commit, index) => (
                    <div
                      key={index}
                      className="bg-slate-800 p-4 rounded-lg"
                      data-testid={`service-commitment-${index}`}
                    >
                      <div className="font-semibold text-white mb-2">{commit.technician_name}</div>
                      <div className="text-sm text-gray-400">
                        Jobs: {commit.jobs_planned} planned, {commit.jobs_actual} completed
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="mt-6 bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
            <p className="text-blue-400 text-sm">
              📱 WhatsApp AI agents will automatically collect commitments daily and update this dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Commitments;