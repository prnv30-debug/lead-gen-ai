import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Bot,
  Send,
  Sparkles,
  Loader2,
  Trash2,
  ChevronRight,
  HelpCircle,
  Flame
} from 'lucide-react';

export default function ChatAssistantDrawer({
  isOpen,
  onClose,
  leads = [],
  onSendMessage,
  chatHistory = [],
  isSending,
  onClearChat,
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isOpen, isSending]);

  if (!isOpen) return null;

  const quickQuestions = [
    'Which leads should I contact first?',
    'Summarize common pain points in my leads',
    'What should I pitch to Apex Dental?',
    'Which leads need 24/7 WhatsApp bots?',
  ];

  const handleSend = (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() || isSending) return;
    onSendMessage(text.trim());
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-slideLeft">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-white text-sm">Lead Copilot AI</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <p className="text-[11px] text-slate-400">Context aware: {leads.length} leads in database</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {chatHistory.length > 0 && (
            <button
              onClick={onClearChat}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Clear chat history"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatHistory.length === 0 ? (
          <div className="text-center py-6 px-2 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-950/50 border border-purple-800/60 flex items-center justify-center mx-auto text-purple-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Ask Anything About Your Leads</h4>
              <p className="text-xs text-slate-400 mt-1">
                Gemini analyzes your real-time leads database to provide prioritized recommendations, objection responses, and outreach strategies.
              </p>
            </div>

            {/* Quick Questions Chips */}
            <div className="pt-2 text-left space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Suggested Prompts
              </span>
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="w-full text-left p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-purple-600/60 hover:bg-slate-800/70 text-xs text-slate-300 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <span>{q}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-purple-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          chatHistory.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={index}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-purple-600 text-white rounded-tr-sm'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/70 rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}

        {isSending && (
          <div className="flex justify-start">
            <div className="bg-slate-800/90 text-slate-300 border border-slate-700/70 rounded-2xl rounded-tl-sm p-3 text-xs flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
              <span>Analyzing lead database...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Copilot (e.g., 'Who should I email today?')"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-3 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim() || isSending}
            className="absolute right-1.5 p-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
