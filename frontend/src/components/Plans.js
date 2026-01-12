import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Plans = ({ user, onLogout }) => {
  const [dayPlan, setDayPlan] = useState([]);
  const [weekPlan, setWeekPlan] = useState([]);
  const [monthPlan, setMonthPlan] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const [day, week, month] = await Promise.all([
        axios.get(`${API}/plans/day`),
        axios.get(`${API}/plans/week`),
        axios.get(`${API}/plans/month`)
      ]);
      setDayPlan(day.data.plan || []);
      setWeekPlan(week.data.plan || []);
      setMonthPlan(month.data.plan || []);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const PlanView = ({ plans, title, testId }) => (
    <Card className="bg-slate-900/50 backdrop-blur border-slate-700 p-6" data-testid={testId}>
      <h2 className="text-xl font-bold text-white mb-6">{title}</h2>
      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : plans.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p>No {title.toLowerCase()} data available</p>
          <p className="text-sm mt-2">Add data to your Google Sheets</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan, index) => (
            <div key={index} className="bg-slate-800 p-4 rounded-lg" data-testid={`plan-item-${index}`}>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-gray-400 text-sm">Planned</div>
                  <div className="text-white text-lg font-semibold">{plan.planned || 0}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Achieved</div>
                  <div className="text-green-400 text-lg font-semibold">{plan.achieved || 0}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Gap</div>
                  <div className={`text-lg font-semibold ${
                    (plan.planned || 0) - (plan.achieved || 0) > 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {(plan.planned || 0) - (plan.achieved || 0)}
                  </div>
                </div>
              </div>
              {plan.notes && (
                <div className="mt-3 text-gray-400 text-sm">
                  {plan.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );

  return (
    <div className="flex" data-testid="plans-page">
      <Sidebar user={user} onLogout={onLogout} />
      <div className="flex-1 p-8 bg-slate-950 min-h-screen overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Plans & Execution</h1>
            <p className="text-gray-400">Track day/week/month plan vs actual performance</p>
          </div>

          <Tabs defaultValue="day" className="w-full">
            <TabsList className="bg-slate-900 border-slate-700 mb-6">
              <TabsTrigger value="day" data-testid="day-tab">Day Plan</TabsTrigger>
              <TabsTrigger value="week" data-testid="week-tab">Week Plan</TabsTrigger>
              <TabsTrigger value="month" data-testid="month-tab">Month Plan</TabsTrigger>
            </TabsList>

            <TabsContent value="day">
              <PlanView plans={dayPlan} title="Day Plan" testId="day-plan-view" />
            </TabsContent>

            <TabsContent value="week">
              <PlanView plans={weekPlan} title="Week Plan" testId="week-plan-view" />
            </TabsContent>

            <TabsContent value="month">
              <PlanView plans={monthPlan} title="Month Plan" testId="month-plan-view" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Plans;