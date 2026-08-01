"use client";

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'sm' | 'md' | 'lg'>('sm');
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: "Hi! Main aapka personal finance assistant hu. Apne expenses, budgets, ya udhari ke baare me kuch bhi puchiye! 🤖" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const PRESETS = [
    "Bhai mera total net worth kitna hai?",
    "Is mahine maine kis category me sabse jyada kharch kiya?",
    "Udhari ki detail batao, kis se lena/dena hai?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent, textOverride?: string) => {
    if (e) e.preventDefault();
    const userMessage = textOverride || input;
    if (!userMessage.trim()) return;

    setInput('');
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });
      const data = await res.json();
      
      if (data.ok) {
        setMessages([...newMessages, { role: 'assistant', content: data.text }]);
      } else {
        setMessages([...newMessages, { role: 'assistant', content: "Oops! Server error ho gaya. Baad me try karein." }]);
      }
    } catch (err) {
      console.error(err);
      setMessages([...newMessages, { role: 'assistant', content: "Network error! Please check your connection." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-lg shadow-emerald-500/30 hover:scale-110 transition-transform z-50 ${isOpen ? 'hidden' : 'block'}`}
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bg-slate-900 border border-slate-700 shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 ${
          viewMode === 'sm' ? "bottom-6 right-6 w-80 sm:w-96 h-[500px] max-h-[80vh] rounded-2xl" :
          viewMode === 'md' ? "bottom-6 right-6 w-[90vw] sm:w-[600px] h-[700px] max-h-[90vh] rounded-2xl" :
          "inset-0 sm:inset-4 w-full h-full sm:w-auto sm:h-auto rounded-none sm:rounded-2xl"
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <h3 className="font-semibold text-white">Finance Bot</h3>
            </div>
            <div className="flex items-center">
              <div className="flex space-x-1 mr-4 bg-slate-900 p-1 rounded-lg border border-slate-700">
                <button onClick={() => setViewMode('sm')} className={`px-2 py-1 text-xs rounded transition-colors ${viewMode === 'sm' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'}`}>SM</button>
                <button onClick={() => setViewMode('md')} className={`px-2 py-1 text-xs rounded transition-colors ${viewMode === 'md' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'}`}>MD</button>
                <button onClick={() => setViewMode('lg')} className={`px-2 py-1 text-xs rounded transition-colors ${viewMode === 'lg' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'}`}>LG</button>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-emerald-500 text-slate-950 rounded-br-none' 
                    : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                }`}>
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                      table: ({node, ...props}) => <div className="overflow-x-auto my-2"><table className="min-w-full text-left border-collapse text-xs md:text-sm" {...props} /></div>,
                      th: ({node, ...props}) => <th className="border-b border-slate-600 p-2 bg-slate-900/50 font-semibold" {...props} />,
                      td: ({node, ...props}) => <td className="border-b border-slate-700 p-2" {...props} />,
                      a: ({node, ...props}) => <a className="text-emerald-400 hover:underline" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-semibold text-emerald-300" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                      li: ({node, ...props}) => <li className="mb-1" {...props} />,
                      code: ({node, ...props}) => <code className="bg-slate-900 px-1 py-0.5 rounded text-emerald-300" {...props} />
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 text-slate-400 p-3 rounded-2xl rounded-bl-none border border-slate-700">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-slate-800 border-t border-slate-700 flex flex-col space-y-3">
            {/* Presets */}
            <div className="flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide pb-1">
              {PRESETS.map((p, i) => (
                <button 
                  key={i} 
                  type="button"
                  onClick={() => handleSend(undefined, p)} 
                  disabled={loading}
                  className="text-xs bg-slate-900 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full transition-colors border border-slate-700 disabled:opacity-50 flex-shrink-0"
                >
                  {p}
                </button>
              ))}
            </div>

            <form onSubmit={handleSend} className="flex items-center space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything..."
                className="flex-1 bg-slate-900 text-white text-sm px-4 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                autoFocus
              />
              <button 
                type="submit" 
                disabled={loading || !input.trim()}
                className="p-2 bg-emerald-500 text-slate-950 rounded-xl hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
