import React from 'react';
import {
  Sparkles,
  Plus,
  Upload,
  Bot,
  Key,
  RotateCcw,
  Activity,
  Layers
} from 'lucide-react';

export default function Navbar({
  hasApiKey,
  customKey,
  onOpenAddModal,
  onOpenCsvModal,
  onOpenAutoGenerateModal,
  onOpenApiKeyModal,
  onResetDemo,
  onToggleChat,
  isChatOpen,
  leadCount,
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-purple-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">ApexLead<span className="text-purple-400">AI</span></span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-950/60 text-purple-300 border border-purple-800/60 rounded-full uppercase tracking-wider">
                  Gemini MVP
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Autonomous B2B Lead Scoring & Outreach</p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Status / API Key Badge */}
            <button
              onClick={onOpenApiKeyModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                hasApiKey || customKey
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/40'
                  : 'bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/40'
              }`}
              title="Click to configure Gemini API Key"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {hasApiKey || customKey ? 'Gemini 2.0 Active' : 'Set Gemini Key'}
              </span>
              <span className={`w-2 h-2 rounded-full ${hasApiKey || customKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            </button>

            {/* Quick Action: Auto-Generate 10 Leads */}
            <button
              onClick={onOpenAutoGenerateModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Auto-Gen 10 Leads</span>
              <span className="sm:hidden">Auto-Gen</span>
            </button>

            {/* Quick Action: Bulk CSV */}
            <button
              onClick={onOpenCsvModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-slate-200 border border-slate-700 hover:bg-slate-800 transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">CSV Upload</span>
            </button>

            {/* Quick Action: Add Lead */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Lead</span>
            </button>

            {/* AI Chat Drawer Button */}
            <button
              onClick={onToggleChat}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                isChatOpen
                  ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/30'
                  : 'bg-slate-900 text-purple-300 border-purple-900/50 hover:bg-purple-950/50'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden md:inline">AI Copilot</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
