import React, { useState } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AIChat = ({ user, onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/ai/chat`, {
        message: input
      });

      const aiMessage = { role: 'assistant', content: response.data.response };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex" data-testid="ai-chat-page">
      <Sidebar user={user} onLogout={onLogout} />
      <div className="flex-1 p-8 bg-slate-950 min-h-screen overflow-auto">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">AI Business Assistant</h1>
            <p className="text-gray-400">Ask anything about your business data</p>
          </div>

          <Card className="bg-slate-900/50 backdrop-blur border-slate-700 flex-1 flex flex-col" data-testid="chat-container">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-12">
                  <p className="text-lg mb-4">Start a conversation</p>
                  <div className="text-sm space-y-2">
                    <p>Try asking:</p>
                    <p className="text-blue-400">"Which branch is performing best?"</p>
                    <p className="text-blue-400">"Show me pending finance cases"</p>
                    <p className="text-blue-400">"Executive performance summary"</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    data-testid={`message-${index}`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-gray-200'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex justify-start" data-testid="loading-indicator">
                  <div className="bg-slate-800 text-gray-400 p-4 rounded-lg">
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-700">
              <div className="flex gap-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a question..."
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-gray-500"
                  disabled={loading}
                  data-testid="chat-input"
                />
                <Button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="bg-blue-600 hover:bg-blue-700 px-6"
                  data-testid="send-button"
                >
                  Send
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIChat;