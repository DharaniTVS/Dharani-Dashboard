import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Sparkles, Send, X, Minimize2, Bot, User } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FloatingAI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className=\"fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50\"
        data-testid=\"ai-assistant-button\"
      >
        <Sparkles className=\"w-6 h-6 text-white\" />
      </button>
    );
  }

  return (
    <Card 
      className={`fixed bottom-6 right-6 bg-white rounded-2xl border border-gray-200 shadow-2xl z-50 transition-all duration-200 ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
      }`}
      data-testid=\"ai-assistant-window\"
    >
      {/* Header */}
      <div className=\"flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-2xl\">
        <div className=\"flex items-center gap-3\">
          <div className=\"w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center\">
            <Sparkles className=\"w-5 h-5 text-white\" />
          </div>
          <div>
            <h3 className=\"text-sm font-semibold text-gray-900\">AI Assistant</h3>
            <p className=\"text-xs text-gray-600\">Powered by Gemini</p>
          </div>
        </div>
        <div className=\"flex items-center gap-2\">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className=\"p-1 hover:bg-gray-200 rounded transition-colors\"
          >
            <Minimize2 className=\"w-4 h-4 text-gray-600\" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className=\"p-1 hover:bg-gray-200 rounded transition-colors\"
            data-testid=\"close-ai-button\"
          >
            <X className=\"w-4 h-4 text-gray-600\" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className=\"flex-1 overflow-y-auto p-4 space-y-4 h-[460px]\">
            {messages.length === 0 ? (
              <div className=\"text-center py-12\">
                <div className=\"w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-3\">
                  <Sparkles className=\"w-6 h-6 text-indigo-600\" />
                </div>
                <h4 className=\"text-sm font-semibold text-gray-900 mb-1\">Ask me anything</h4>
                <p className=\"text-xs text-gray-600\">I can help with sales, service, and inventory questions</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className=\"w-6 h-6 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0\">
                      <Bot className=\"w-4 h-4 text-white\" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] p-3 rounded-xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className=\"w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0\">
                      <User className=\"w-4 h-4 text-indigo-600\" />
                    </div>
                  )}
                </div>
              ))
            )}
            {loading && (
              <div className=\"flex gap-2\">
                <div className=\"w-6 h-6 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0\">
                  <Bot className=\"w-4 h-4 text-white\" />
                </div>
                <div className=\"bg-gray-100 p-3 rounded-xl\">
                  <div className=\"flex items-center gap-1\">
                    <div className=\"w-2 h-2 bg-gray-400 rounded-full animate-bounce\" style={{ animationDelay: '0ms' }}></div>
                    <div className=\"w-2 h-2 bg-gray-400 rounded-full animate-bounce\" style={{ animationDelay: '150ms' }}></div>
                    <div className=\"w-2 h-2 bg-gray-400 rounded-full animate-bounce\" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className=\"p-3 border-t border-gray-200 bg-gray-50 rounded-b-2xl\">
            <div className=\"flex gap-2\">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder=\"Ask a question...\"
                className=\"flex-1 h-10 bg-white border-gray-200 text-sm\"
                disabled={loading}
              />
              <Button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className=\"h-10 px-4 bg-indigo-600 hover:bg-indigo-700\"
                size=\"sm\"
              >
                <Send className=\"w-4 h-4\" />
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

export default FloatingAI;
