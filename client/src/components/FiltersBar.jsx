import React from 'react';
import {
  Search,
  Sparkles,
  LayoutGrid,
  List,
  Filter,
  Flame,
  Zap,
  Snowflake,
  Loader2
} from 'lucide-react';

export default function FiltersBar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  status,
  onStatusChange,
  city,
  onCityChange,
  type,
  onTypeChange,
  cities = [],
  types = [],
  viewMode,
  onViewModeChange,
  onScoreAll,
  isScoringAll,
  unscoredCount = 0,
}) {
  const categories = [
    { id: 'All', label: 'All Scores' },
    { id: 'Hot', label: '🔥 Hot (75+)', icon: Flame, textClass: 'text-emerald-400' },
    { id: 'Warm', label: '⚡ Warm (45-74)', icon: Zap, textClass: 'text-amber-400' },
    { id: 'Cold', label: '❄️ Cold (<45)', icon: Snowflake, textClass: 'text-blue-400' },
    { id: 'Unscored', label: 'Unscored' },
  ];

  return (
    <div className="glass-card p-4 rounded-xl border border-slate-800 mb-6 space-y-4">
      {/* Top Row: Search and Score All CTA */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search leads by business name, industry, city, or pain points..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Score All Unscored Button */}
          {unscoredCount > 0 && (
            <button
              onClick={onScoreAll}
              disabled={isScoringAll}
              className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-700/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isScoringAll ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>AI Scoring Leads...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Score All Unscored ({unscoredCount})</span>
                </>
              )}
            </button>
          )}

          {/* View mode toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5">
            <button
              onClick={() => onViewModeChange('table')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-slate-800 text-purple-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Table view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('cards')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'cards' ? 'bg-slate-800 text-purple-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Card view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Score Pills & Dropdowns */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => {
            const isSelected = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Dropdown */}
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Replied">Replied</option>
            <option value="Converted">Converted</option>
          </select>

          {/* City Dropdown */}
          {cities.length > 0 && (
            <select
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="All">All Cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          {/* Industry Type Dropdown */}
          {types.length > 0 && (
            <select
              value={type}
              onChange={(e) => onTypeChange(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="All">All Industries</option>
              {types.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
}
