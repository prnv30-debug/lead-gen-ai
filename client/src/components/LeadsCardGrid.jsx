import React from 'react';
import {
  ExternalLink,
  Sparkles,
  Send,
  Eye,
  Trash2,
  Flame,
  Zap,
  Snowflake,
  Loader2,
  MapPin,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function LeadsCardGrid({
  leads = [],
  scoringLeadId,
  onScoreLead,
  onOpenOutreach,
  onOpenDetails,
  onDeleteLead,
  onStatusChange,
}) {
  if (leads.length === 0) return null;

  const getScoreBadge = (score, category) => {
    if (score === null || score === undefined) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
          Unscored
        </span>
      );
    }
    if (category === 'Hot' || score >= 75) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
          <Flame className="w-3.5 h-3.5 text-emerald-400" />
          <span>{score} • Hot</span>
        </span>
      );
    }
    if (category === 'Warm' || score >= 45) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-800/80">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>{score} • Warm</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900 text-blue-300 border border-blue-900/60">
        <Snowflake className="w-3.5 h-3.5 text-blue-400" />
        <span>{score} • Cold</span>
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {leads.map((lead) => {
        const isScoring = scoringLeadId === lead.id;

        return (
          <div
            key={lead.id}
            className="glass-card rounded-xl border border-slate-800 p-4 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            {/* Top: Name, Badge, City */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-white text-base leading-snug">{lead.business_name}</h4>
                    {lead.website && (
                      <a
                        href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-500 hover:text-slate-300"
                        title={lead.website}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  <span className="text-xs font-medium text-purple-400">{lead.business_type}</span>
                </div>
                <div>{getScoreBadge(lead.score, lead.score_category)}</div>
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-400 mb-3">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{lead.city}</span>
              </div>

              {/* Reason / Notes snippet */}
              <p className="text-xs text-slate-300 line-clamp-2 mb-3 bg-slate-900/60 p-2 rounded border border-slate-800/80">
                {lead.score_details?.reason || lead.notes || 'No notes provided.'}
              </p>

              {/* Suggested Service Pill */}
              {lead.score_details?.suggested_service && (
                <div className="mb-4">
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-2 py-0.5 rounded-full inline-block truncate max-w-full">
                    💡 {lead.score_details.suggested_service}
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <select
                value={lead.status}
                onChange={(e) => onStatusChange(lead.id, e.target.value)}
                className="bg-slate-900 border border-slate-700/80 text-xs rounded-md px-2 py-1 text-slate-300 focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Replied">Replied</option>
                <option value="Converted">Converted</option>
              </select>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onScoreLead(lead.id)}
                  disabled={isScoring}
                  className="p-1.5 rounded-lg bg-purple-950/60 text-purple-300 border border-purple-800/60 hover:bg-purple-900/60 transition-all cursor-pointer"
                  title="AI Lead Score"
                >
                  {isScoring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => onOpenOutreach(lead)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/60 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Outreach</span>
                </button>

                <button
                  onClick={() => onOpenDetails(lead)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-all cursor-pointer"
                  title="View details"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onDeleteLead(lead.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent transition-all cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
