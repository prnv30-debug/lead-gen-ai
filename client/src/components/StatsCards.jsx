import React from 'react';
import { Users, Flame, Send, CheckCircle2, TrendingUp, Zap } from 'lucide-react';

export default function StatsCards({ stats, onFilterCategory, currentCategory }) {
  if (!stats) return null;

  const cards = [
    {
      id: 'total',
      label: 'Total Leads',
      value: stats.total || 0,
      subtext: `${stats.unscored || 0} unscored`,
      icon: Users,
      color: 'from-blue-600 to-indigo-600',
      border: 'border-blue-900/30',
      activeFilter: 'All',
    },
    {
      id: 'hot',
      label: 'Hot Leads (75-100)',
      value: stats.hot || 0,
      subtext: 'High purchase intent',
      icon: Flame,
      color: 'from-emerald-600 to-teal-600',
      border: 'border-emerald-900/30',
      activeFilter: 'Hot',
      badge: '🔥 Priority',
    },
    {
      id: 'warm',
      label: 'Warm Leads (45-74)',
      value: stats.warm || 0,
      subtext: 'Nurture & qualify',
      icon: Zap,
      color: 'from-amber-600 to-yellow-600',
      border: 'border-amber-900/30',
      activeFilter: 'Warm',
    },
    {
      id: 'contacted',
      label: 'Outreach Pipeline',
      value: stats.contacted || 0,
      subtext: `${stats.replied || 0} replied`,
      icon: Send,
      color: 'from-purple-600 to-pink-600',
      border: 'border-purple-900/30',
    },
    {
      id: 'converted',
      label: 'Converted Clients',
      value: stats.converted || 0,
      subtext: `${stats.conversionRate || 0}% conversion rate`,
      icon: CheckCircle2,
      color: 'from-rose-600 to-orange-600',
      border: 'border-rose-900/30',
      badge: `${stats.conversionRate || 0}% Win`,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const isClickable = Boolean(card.activeFilter);
        const isSelected = currentCategory === card.activeFilter;

        return (
          <div
            key={card.id}
            onClick={() => isClickable && onFilterCategory(isSelected ? 'All' : card.activeFilter)}
            className={`glass-card p-4 rounded-xl border transition-all ${card.border} ${
              isClickable ? 'cursor-pointer hover:border-slate-600 hover:scale-[1.02]' : ''
            } ${isSelected ? 'ring-2 ring-purple-500 bg-slate-800/80' : ''}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">{card.label}</span>
              <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color} text-white shadow-sm`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-white tracking-tight">{card.value}</span>
              {card.badge && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {card.badge}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">{card.subtext}</p>
          </div>
        );
      })}
    </div>
  );
}
