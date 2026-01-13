import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Settings as SettingsIcon, Moon, Sun, Mail, Plus, Trash2, Save, Shield, Bot, Key, Eye, EyeOff } from 'lucide-react';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Settings = ({ user, onLogout }) => {
  const [settings, setSettings] = useState({
    dark_mode: false,
    allowed_emails: [],
    ai_api_key: '',
    ai_provider: 'gemini',
    ai_model: 'gemini-2.5-flash'
  });
  const [newEmail, setNewEmail] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiProvider, setAiProvider] = useState('gemini');
  const [aiModel, setAiModel] = useState('gemini-2.5-flash');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const aiModels = {
    gemini: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
    openai: ['gpt-5.2', 'gpt-5.1', 'gpt-4o', 'gpt-4.1'],
    anthropic: ['claude-4-sonnet-20250514', 'claude-sonnet-4-5-20250929', 'claude-3-5-haiku-20241022']
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      const data = response.data;
      setSettings(data);
      if (data.ai_api_key) setApiKey(data.ai_api_key);
      if (data.ai_provider) setAiProvider(data.ai_provider);
      if (data.ai_model) setAiModel(data.ai_model);
      
      // Apply dark mode on load
      if (data.dark_mode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    setSaving(true);
    try {
      await axios.put(`${API}/settings`, newSettings);
      setSettings(newSettings);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Failed to update settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleDarkModeToggle = (checked) => {
    const newSettings = { ...settings, dark_mode: checked };
    updateSettings(newSettings);
    
    if (checked) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const saveAiSettings = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/settings/ai?ai_api_key=${encodeURIComponent(apiKey)}&ai_provider=${aiProvider}&ai_model=${aiModel}`);
      setMessage({ type: 'success', text: 'AI settings saved successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Failed to save AI settings:', error);
      setMessage({ type: 'error', text: 'Failed to save AI settings' });
    } finally {
      setSaving(false);
    }
  };

  const addEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    if (settings.allowed_emails.includes(newEmail)) {
      setMessage({ type: 'error', text: 'Email already in the list' });
      return;
    }

    try {
      await axios.post(`${API}/settings/add-email?email=${encodeURIComponent(newEmail)}`);
      setSettings({
        ...settings,
        allowed_emails: [...settings.allowed_emails, newEmail]
      });
      setNewEmail('');
      setMessage({ type: 'success', text: 'Email added successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Failed to add email:', error);
      setMessage({ type: 'error', text: 'Failed to add email' });
    }
  };

  const removeEmail = async (email) => {
    try {
      await axios.delete(`${API}/settings/remove-email?email=${encodeURIComponent(email)}`);
      setSettings({
        ...settings,
        allowed_emails: settings.allowed_emails.filter(e => e !== email)
      });
      setMessage({ type: 'success', text: 'Email removed successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Failed to remove email:', error);
      setMessage({ type: 'error', text: 'Failed to remove email' });
    }
  };

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar user={user} onLogout={onLogout} />
        <div className="flex-1 p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen" data-testid="settings-page">
      <Sidebar user={user} onLogout={onLogout} />
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-600 mt-1">Manage application preferences, AI configuration, and access control</p>
            </div>
          </div>
        </div>

        <div className="p-8 max-w-4xl">
          {/* Message */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
              'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          {/* AI Configuration Settings */}
          <Card className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Bot className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">AI Assistant Configuration</h2>
            </div>

            <div className="space-y-4">
              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Key className="w-4 h-4 inline mr-1" />
                  AI API Key
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="Enter your API key (leave empty to use default)"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="bg-white text-gray-900 border-gray-300 pr-10"
                      data-testid="api-key-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to use the default Emergent LLM key. You can use your own OpenAI, Gemini, or Anthropic API key.
                </p>
              </div>

              {/* Provider Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">AI Provider</label>
                  <Select value={aiProvider} onValueChange={(value) => {
                    setAiProvider(value);
                    setAiModel(aiModels[value][0]);
                  }}>
                    <SelectTrigger className="bg-white text-gray-900 border-gray-300" data-testid="ai-provider-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="gemini" className="text-gray-900 hover:bg-gray-100">Google Gemini</SelectItem>
                      <SelectItem value="openai" className="text-gray-900 hover:bg-gray-100">OpenAI (ChatGPT)</SelectItem>
                      <SelectItem value="anthropic" className="text-gray-900 hover:bg-gray-100">Anthropic (Claude)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                  <Select value={aiModel} onValueChange={setAiModel}>
                    <SelectTrigger className="bg-white text-gray-900 border-gray-300" data-testid="ai-model-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {aiModels[aiProvider].map(model => (
                        <SelectItem key={model} value={model} className="text-gray-900 hover:bg-gray-100">{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={saveAiSettings}
                disabled={saving}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                data-testid="save-ai-settings"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save AI Settings'}
              </Button>
            </div>
          </Card>

          {/* Appearance Settings */}
          <Card className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              {settings.dark_mode ? <Moon className="w-5 h-5 text-indigo-600" /> : <Sun className="w-5 h-5 text-indigo-600" />}
              <h2 className="text-lg font-semibold text-gray-900">Appearance</h2>
            </div>

            <div className="flex items-center justify-between py-4 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Dark Mode</h3>
                <p className="text-sm text-gray-600">Enable dark theme for the application</p>
              </div>
              <Switch
                checked={settings.dark_mode}
                onCheckedChange={handleDarkModeToggle}
                data-testid="dark-mode-toggle"
              />
            </div>
          </Card>

          {/* Access Control Settings */}
          <Card className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Access Control</h2>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Only users with email addresses in this list will be able to access the application. 
                Leave empty to allow all authenticated users.
              </p>

              {/* Add Email */}
              <div className="flex gap-3 mb-4">
                <div className="flex-1 relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="Enter email address to whitelist"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addEmail()}
                    className="pl-10 bg-white text-gray-900 border-gray-300"
                    data-testid="email-input"
                  />
                </div>
                <Button 
                  onClick={addEmail}
                  className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                  data-testid="add-email-button"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>

              {/* Email List */}
              <div className="space-y-2">
                {settings.allowed_emails.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <Mail className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No email restrictions. All authenticated users can access.</p>
                  </div>
                ) : (
                  settings.allowed_emails.map((email, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      data-testid={`email-item-${index}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                          <Mail className="w-4 h-4 text-indigo-600" />
                        </div>
                        <span className="text-sm text-gray-900">{email}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEmail(email)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        data-testid={`remove-email-${index}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Current User Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Your Account</h3>
              <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                {user?.picture ? (
                  <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-600">{user?.email}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
