import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, HeartHandshake } from 'lucide-react';
import api from '../services/api';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am your AI Blood Donation Assistant. 🩸 Ask me anything about eligibility, preparation, safety, or tatoos! How can I help you save lives today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userMessage }]);
    setLoading(true);

    try {
      // Build history payload for Gemini
      const chatHistory = [];
      for (let i = 0; i < messages.length - 1; i += 2) {
        if (messages[i] && messages[i + 1]) {
          chatHistory.push({
            question: messages[i].sender === 'user' ? messages[i].text : messages[i+1].text,
            answer: messages[i].sender === 'bot' ? messages[i].text : messages[i+1].text
          });
        }
      }

      const res = await api.post('/ai/chat', {
        question: userMessage,
        history: chatHistory
      });

      setMessages((prev) => [...prev, { sender: 'bot', text: res.data.reply }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Sorry, I encountered an issue connecting to the AI helper. Please try again soon. Disclaimer: Always seek direct medical advice.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-bloodred-500 text-white shadow-lg shadow-bloodred-500/30 transition-transform duration-300 hover:scale-110 hover:bg-bloodred-600 focus:outline-none"
        >
          <MessageSquare className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bloodred-400 opacity-75"></span>
            <span className="relative inline-flex h-4 w-4 rounded-full bg-bloodred-600 text-[10px] font-bold text-white flex items-center justify-center">AI</span>
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="glass-panel flex h-[500px] w-[360px] flex-col rounded-2xl shadow-2xl overflow-hidden border border-slate-800 transition-all duration-300">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-bloodred-600 to-slate-900 px-4 py-3.5 text-white">
            <div className="flex items-center space-x-2.5">
              <div className="rounded-lg bg-slate-900/40 p-1.5">
                <HeartHandshake className="h-5 w-5 text-bloodred-100" />
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-none">BloodLink Assistant</h3>
                <span className="text-[10px] text-bloodred-200">Powered by Gemini AI</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-bloodred-100 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/90 scrollbar-thin">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex max-w-[85%] items-start space-x-2 rounded-2xl px-3.5 py-2.5 text-xs shadow-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-bloodred-500 text-white rounded-br-none'
                      : 'bg-slate-900 text-slate-200 rounded-bl-none border border-slate-800'
                  }`}
                >
                  {msg.sender === 'bot' && <Bot className="mr-1.5 h-3.5 w-3.5 text-bloodred-400 shrink-0 mt-0.5" />}
                  <div className="whitespace-pre-line">{msg.text}</div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-2 rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-xs text-slate-400 rounded-bl-none">
                  <Bot className="h-3.5 w-3.5 text-bloodred-400 animate-bounce" />
                  <span className="flex space-x-1 items-center">
                    <span>Typing</span>
                    <span className="animate-bounce delay-75">.</span>
                    <span className="animate-bounce delay-150">.</span>
                    <span className="animate-bounce delay-200">.</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form input */}
          <form onSubmit={handleSend} className="border-t border-slate-800 bg-slate-900 p-3 flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about tattoo, weight, timing..."
              className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-bloodred-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-bloodred-500 text-white hover:bg-bloodred-600 focus:outline-none disabled:opacity-50 disabled:hover:bg-bloodred-500 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
