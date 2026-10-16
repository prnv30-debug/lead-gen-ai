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
  Building2,
  MapPin
} from 'lucide-react';

export default function LeadsTable({
  leads = [],
  scoringLeadId,
  onScoreLead,
  onOpenOutreach,
  onOpenDetails,
  onDeleteLead,
  onStatusChange,
}) {
  if (leads.length === 0) {
    return (
      <div className="glass-card rounded-xl border border-slate-800 p-12 text-center">
        <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white mb-1">No Leads Found</h3>
        <p className="text-sm text-slate-400 max-w-sm mx-auto mb-4">
          Try clearing your filters or auto-generate 10 realistic leads using Gemini AI.
        </p>
      </div>
    );
  }

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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/80 shadow-sm shadow-emerald-900/30">
          <Flame className="w-3.5 h-3.5 text-emerald-400" />
          <span>{score} • Hot</span>
        </span>
      );
    }

    if (category === 'Warm' || score >= 45) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950/60 text-amber-300 border border-amber-800/80 shadow-sm shadow-amber-900/30">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>{score} • Warm</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900 text-blue-300 border border-blue-900/60 shadow-sm">
        <Snowflake className="w-3.5 h-3.5 text-blue-400" />
        <span>{score} • Cold</span>
      </span>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Converted':
        return 'bg-emerald-950 text-emerald-300 border-emerald-700';
      case 'Replied':
        return 'bg-purple-950 text-purple-300 border-purple-700';
      case 'Contacted':
        return 'bg-blue-950 text-blue-300 border-blue-700';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="glass-card rounded-xl border border-slate-800 overflow-hidden shadow-xl mb-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/70 text-slate-400 font-medium text-xs uppercase tracking-wider">
              <th className="py-3.5 px-4">Business</th>
              <th className="py-3.5 px-4">Location</th>
              <th className="py-3.5 px-4">AI Score</th>
              <th className="py-3.5 px-4">Suggested Service</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {leads.map((lead) => {
              const isScoring = scoringLeadId === lead.id;

              return (
                <tr
                  key={lead.id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Business Name & Type */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                          {lead.business_name}
                        </span>
                        {lead.website && (
                          <a
                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 hover:text-slate-300 transition-colors"
                            title={lead.website}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 mt-0.5">{lead.business_type}</span>
                    </div>
                  </td>

                  {/* Location */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span>{lead.city}</span>
                    </div>
                  </td>

                  {/* AI Score Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getScoreBadge(lead.score, lead.score_category)}
                  </td>

                  {/* Suggested Service / Opportunity */}
                  <td className="py-3.5 px-4 max-w-xs">
                    {lead.score_details?.suggested_service ? (
                      <div className="truncate text-xs font-medium text-slate-200 bg-slate-900/80 px-2 py-1 rounded border border-slate-800" title={lead.score_details.suggested_service}>
                        {lead.score_details.suggested_service}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic">Score to reveal service</span>
                    )}
                  </td>

                  {/* Status Dropdown */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <select
                      value={lead.status}
                      onChange={(e) => onStatusChange(lead.id, e.target.value)}
                      className={`text-xs rounded-md px-2.5 py-1 font-medium border focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer ${getStatusColor(
                        lead.status
                      )}`}
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Replied">Replied</option>
                      <option value="Converted">Converted</option>
                    </select>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* AI Score Trigger */}
                      <button
                        onClick={() => onScoreLead(lead.id)}
                        disabled={isScoring}
                        className="p-1.5 rounded-lg text-xs font-medium bg-purple-950/60 text-purple-300 border border-purple-800/60 hover:bg-purple-900/60 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
                        title={lead.score !== null ? 'Re-score with Gemini AI' : 'Score with Gemini AI'}
                      >
                        {isScoring ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-300" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Generate Outreach */}
                      <button
                        onClick={() => onOpenOutreach(lead)}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/60 hover:text-white transition-all cursor-pointer"
                        title="Generate personalized WhatsApp and Cold Email"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Outreach</span>
                      </button>

                      {/* View Dossier / Details */}
                      <button
                        onClick={() => onOpenDetails(lead)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all cursor-pointer"
                        title="View Full Lead Dossier"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onDeleteLead(lead.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/40 transition-all cursor-pointer"
                        title="Delete lead"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
