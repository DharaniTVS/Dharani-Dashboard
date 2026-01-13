import React, { useState } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Shield, ArrowRight } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Login = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post(`${API}/auth/send-otp`, { phone });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/verify-otp`, {
        phone,
        code: otp,
        name: 'User',
        role: 'owner'
      });
      onLogin(response.data.user, response.data.access_token);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-12 flex-col justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Dharani TVS</h1>
          <p className="text-xl text-indigo-100">Business AI Manager</p>
        </div>
        <div className="space-y-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h3 className="text-white font-semibold text-lg mb-2">Multi-Branch Analytics</h3>
            <p className="text-indigo-100 text-sm">Track performance across all 5 branches in real-time with AI-powered insights</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h3 className="text-white font-semibold text-lg mb-2">AI Assistant</h3>
            <p className="text-indigo-100 text-sm">Get instant answers about sales, service, and performance metrics</p>
          </div>
        </div>
        <p className="text-indigo-100 text-sm">© 2025 Dharani Motors LLP. All rights reserved.</p>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md p-8 bg-white rounded-2xl border border-gray-200 shadow-xl" data-testid="login-card">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 XXXXXXXXXX"
                  required
                  className="h-12 bg-gray-50 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                  data-testid="phone-input"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3" data-testid="error-message">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl"
                data-testid="send-otp-button"
              >
                {loading ? 'Sending...' : (
                  <span className="flex items-center justify-center gap-2">
                    Send OTP
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-xs text-center">
                  📡 Demo mode: Use any 6-digit code after sending OTP
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP
                </label>
                <Input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  required
                  className="h-12 bg-gray-50 border-gray-200 text-center text-2xl tracking-widest font-semibold focus:border-indigo-500 focus:ring-indigo-500"
                  data-testid="otp-input"
                />
                <p className="text-sm text-gray-600 text-center mt-2">
                  Sent to {phone}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3" data-testid="error-message">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl"
                data-testid="verify-otp-button"
              >
                {loading ? 'Verifying...' : 'Verify & Login'}
              </Button>

              <Button
                type="button"
                onClick={() => { setStep(1); setOtp(''); setError(''); }}
                variant="ghost"
                className="w-full text-gray-600 hover:text-gray-900"
                data-testid="back-button"
              >
                ← Back to phone number
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Login;