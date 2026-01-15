import React from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { BarChart3, Users, TrendingUp, Shield, Zap, Globe, ArrowRight, CheckCircle } from 'lucide-react';

const Login = () => {
  const handleGoogleLogin = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoLTZ2LTZoNnptMC0xMHY2aC02di02aDZ6bTAtMTB2Nmgtdnp0LTZoNnptMTAgMHY2aC02di02aDZ6bTAgMTB2Nmgtdnp0LTZoNnptMCAxMHY2aC02di02aDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50"></div>

      <div className="relative z-10">
        {/* Header */}
        <header className="px-6 lg:px-12 py-6">
          <nav className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Dharani TVS</h1>
                <p className="text-xs text-purple-300">Business Manager</p>
              </div>
            </div>
            <Button 
              onClick={handleGoogleLogin}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
              data-testid="header-login-btn"
            >
              Login
            </Button>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="px-6 lg:px-12 py-12 lg:py-20">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-purple-200">AI-Powered Analytics Platform</span>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Dharani TVS
                <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Business Manager
                </span>
              </h1>
              
              <p className="text-lg lg:text-xl text-gray-300 mb-8 max-w-xl mx-auto lg:mx-0">
                Transform your dealership operations with real-time analytics, AI insights, and comprehensive multi-branch management.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  onClick={handleGoogleLogin}
                  className="h-14 px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl text-lg shadow-lg shadow-purple-500/25 transition-all hover:shadow-purple-500/40"
                  data-testid="hero-login-btn"
                >
                  Get Started <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  variant="outline"
                  className="h-14 px-8 bg-white/5 hover:bg-white/10 text-white border border-white/20 rounded-xl text-lg backdrop-blur-sm"
                >
                  Watch Demo
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/10">
                <div>
                  <p className="text-3xl font-bold text-white">5</p>
                  <p className="text-sm text-gray-400">Branches</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">24/7</p>
                  <p className="text-sm text-gray-400">Real-time Sync</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">AI</p>
                  <p className="text-sm text-gray-400">Powered</p>
                </div>
              </div>
            </div>

            {/* Right - Login Card */}
            <div className="flex justify-center lg:justify-end">
              <Card className="w-full max-w-md p-8 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl" data-testid="login-card">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/30">
                    <Shield className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
                  <p className="text-gray-400">Sign in to Dharani TVS Business Manager</p>
                </div>

                <div className="space-y-6">
                  <Button
                    onClick={handleGoogleLogin}
                    className="w-full h-14 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-xl border-0 flex items-center justify-center gap-3 transition-all shadow-lg"
                    data-testid="google-login-button"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </Button>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/20"></div>
                    <span className="text-sm text-gray-400">Secure Login</span>
                    <div className="flex-1 h-px bg-white/20"></div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-gray-300 text-sm text-center">
                      🔒 Enterprise-grade security with Google authentication
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-6 lg:px-12 py-16 lg:py-24">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Powerful Features for Your Business
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Everything you need to manage your TVS dealership operations efficiently
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <Card className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Multi-Branch Dashboard</h3>
                <p className="text-gray-400">Monitor all 5 branches from a single dashboard with real-time data synchronization</p>
              </Card>

              {/* Feature 2 */}
              <Card className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Sales Analytics</h3>
                <p className="text-gray-400">Track enquiries, bookings, and sales with executive-wise performance metrics</p>
              </Card>

              {/* Feature 3 */}
              <Card className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">AI Assistant</h3>
                <p className="text-gray-400">Get instant insights and answers about your business data with AI-powered chat</p>
              </Card>

              {/* Feature 4 */}
              <Card className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Visual Reports</h3>
                <p className="text-gray-400">Beautiful charts and graphs for sales trends, category distribution, and more</p>
              </Card>

              {/* Feature 5 */}
              <Card className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Service Management</h3>
                <p className="text-gray-400">Upload service reports and track technician productivity with PDF parsing</p>
              </Card>

              {/* Feature 6 */}
              <Card className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Inventory Control</h3>
                <p className="text-gray-400">Real-time stock visibility across all branches synced from Google Sheets</p>
              </Card>
            </div>
          </div>
        </section>

        {/* Branches Section */}
        <section className="px-6 lg:px-12 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Our Branches</h2>
              <p className="text-gray-400">Managing 5 branches across the region</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4">
              {['Kumarapalayam', 'Kavindapadi', 'Ammapettai', 'Anthiyur', 'Bhavani'].map((branch, index) => (
                <div 
                  key={branch}
                  className="flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-6 py-3 hover:bg-white/10 transition-all"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-white font-medium">{branch}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 lg:px-12 py-8 border-t border-white/10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-semibold">Dharani TVS Business Manager</span>
            </div>
            <p className="text-gray-500 text-sm">© 2025 Dharani Motors LLP. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Login;
