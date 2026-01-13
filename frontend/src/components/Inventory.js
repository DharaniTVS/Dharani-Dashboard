import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Package, AlertTriangle, TrendingUp, ShoppingCart } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Inventory = ({ user, onLogout }) => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      // For now using demo data until we have inventory endpoint
      setInventory([
        { item_id: '1', item_name: 'Engine Oil 10W40', quantity: 45, min_stock: 20, branch: 'Bhavani', price: 350 },
        { item_id: '2', item_name: 'Air Filter', quantity: 12, min_stock: 15, branch: 'Bhavani', price: 250 },
        { item_id: '3', item_name: 'Brake Pads', quantity: 8, min_stock: 10, branch: 'Kavindapadi', price: 800 },
        { item_id: '4', item_name: 'Spark Plug', quantity: 35, min_stock: 25, branch: 'Anthiyur', price: 150 },
        { item_id: '5', item_name: 'Chain Lubricant', quantity: 5, min_stock: 15, branch: 'Kumarapalayam', price: 180 },
        { item_id: '6', item_name: 'Coolant', quantity: 28, min_stock: 20, branch: 'Ammapettai', price: 200 }
      ]);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
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

  const lowStockCount = inventory.filter(item => item.quantity < item.min_stock).length;
  const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  return (
    <div className="flex bg-gray-50" data-testid="inventory-page">
      <Sidebar user={user} onLogout={onLogout} />
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
              <p className="text-sm text-gray-600 mt-1">Track spare parts and inventory across all branches</p>
            </div>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Add Item
            </Button>
          </div>
        </div>

        <div className="p-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Items"
              value={inventory.length}
              icon={Package}
              color="bg-gradient-to-br from-blue-500 to-blue-600"
              subtitle="Unique products"
            />
            <StatCard
              title="Low Stock Alert"
              value={lowStockCount}
              icon={AlertTriangle}
              color="bg-gradient-to-br from-red-500 to-red-600"
              subtitle="Needs reorder"
            />
            <StatCard
              title="Total Value"
              value={`₹${(totalValue / 1000).toFixed(1)}K`}
              icon={TrendingUp}
              color="bg-gradient-to-br from-green-500 to-green-600"
              subtitle="Inventory worth"
            />
            <StatCard
              title="Active Branches"
              value="5"
              icon={ShoppingCart}
              color="bg-gradient-to-br from-purple-500 to-purple-600"
              subtitle="Stocking items"
            />
          </div>

          {/* Inventory Table */}
          <Card className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Spare Parts Inventory</h2>
              <p className="text-sm text-gray-600 mt-1">Current stock levels across all branches</p>
            </div>
            {loading ? (
              <div className="p-6 text-gray-600">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-6">Item Name</th>
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-6">Branch</th>
                      <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-6">Quantity</th>
                      <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-6">Min Stock</th>
                      <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-6">Price (₹)</th>
                      <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider py-3 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {inventory.map((item, index) => (
                      <tr
                        key={item.item_id}
                        className="hover:bg-gray-50 transition-colors"
                        data-testid={`inventory-row-${index}`}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Package className="w-5 h-5 text-purple-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{item.item_name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600">{item.branch}</td>
                        <td className="py-4 px-6 text-sm font-semibold text-gray-900 text-right">{item.quantity}</td>
                        <td className="py-4 px-6 text-sm text-gray-600 text-right">{item.min_stock}</td>
                        <td className="py-4 px-6 text-sm font-semibold text-gray-900 text-right">₹{item.price}</td>
                        <td className="py-4 px-6 text-right">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            item.quantity < item.min_stock
                              ? 'bg-red-100 text-red-700'
                              : item.quantity < item.min_stock * 1.5
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {item.quantity < item.min_stock ? 'Low Stock' : item.quantity < item.min_stock * 1.5 ? 'Moderate' : 'In Stock'}
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

export default Inventory;