import React from 'react';
import { BarChart3, Filter } from 'lucide-react';

export default function ScoreChart({ buckets = [], total = 0, onSelectBucket, activeBucket }) {
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);

  const bucketColors = [
    { bg: 'bg-slate-600', fill: 'from-slate-600 to-slate-500', border: 'border-slate-500', text: 'text-slate-400' },
    { bg: 'bg-cyan-600', fill: 'from-cyan-600 to-blue-500', border: 'border-cyan-500', text: 'text-cyan-400' },
    { bg: 'bg-amber-600', fill: 'from-amber-600 to-yellow-500', border: 'border-amber-500', text: 'text-amber-400' },
    { bg: 'bg-emerald-600', fill: 'from-emerald-600 to-teal-500', border: 'border-emerald-500', text: 'text-emerald-400' },
  ];

  return (
    <div className="glass-card p-4 rounded-xl border border-slate-800 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">Lead Score Distribution</h3>
          <span className="text-xs text-slate-500">(0 to 100 AI Scoring Index)</span>
        </div>
        {activeBucket && (
          <button
            onClick={() => onSelectBucket(null)}
            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
          >
            <Filter className="w-3 h-3" />
            Clear filter ({activeBucket})
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {buckets.map((b, index) => {
          const percentage = total > 0 ? Math.round((b.count / total) * 100) : 0;
          const heightPercent = Math.max(12, Math.round((b.count / maxCount) * 100));
          const color = bucketColors[index] || bucketColors[0];
          const isSelected = activeBucket === b.range;

          return (
            <div
              key={b.range}
              onClick={() => onSelectBucket(isSelected ? null : b.range)}
              className={`p-3 rounded-lg border bg-slate-900/60 transition-all cursor-pointer hover:bg-slate-800/80 ${
                isSelected ? 'ring-2 ring-purple-500 border-purple-500 bg-slate-800' : 'border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-medium text-slate-300">{b.label}</span>
                <span className={`font-bold ${color.text}`}>{b.count} leads</span>
              </div>

              {/* Bar visualization */}
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${color.fill} transition-all duration-500`}
                  style={{ width: `${Math.max(b.count > 0 ? 8 : 0, percentage)}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center mt-2 text-[11px] text-slate-500">
                <span>Range: {b.range}</span>
                <span className="font-semibold text-slate-400">{percentage}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
