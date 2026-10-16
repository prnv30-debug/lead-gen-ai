import React from 'react';
import {
  X,
  Building2,
  MapPin,
  Globe,
  ExternalLink,
  Flame,
  Zap,
  Snowflake,
  Send,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  FileText
} from 'lucide-react';

export default function LeadDetailsModal({
  lead,
  isOpen,
  onClose,
  onOpenOutreach,
  onScoreLead,
  isScoring,
}) {
  if (!isOpen || !lead) return null;

  const score = lead.score;
  const isHot = score >= 75;
  const isWarm = score >= 45 && score < 75;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-purple-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">{lead.business_name}</h3>
                {lead.website && (
                  <a
                    href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-white"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {lead.business_type} • <MapPin className="w-3 h-3 inline text-slate-500" /> {lead.city}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Score Assessment Card */}
          <div className={`p-4 rounded-xl border ${
            score === null
              ? 'bg-slate-950/60 border-slate-800'
              : isHot
              ? 'bg-emerald-950/30 border-emerald-800/60'
              : isWarm
              ? 'bg-amber-950/30 border-amber-800/60'
              : 'bg-blue-950/30 border-blue-800/60'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                AI Lead Qualification Assessment
              </span>
              {score !== null ? (
                <div className="flex items-center gap-1.5">
                  {isHot ? (
                    <Flame className="w-4 h-4 text-emerald-400" />
                  ) : isWarm ? (
                    <Zap className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Snowflake className="w-4 h-4 text-blue-400" />
                  )}
                  <span className={`text-xl font-black ${
                    isHot ? 'text-emerald-400' : isWarm ? 'text-amber-400' : 'text-blue-400'
                  }`}>
                    {score}/100
                  </span>
                  <span className="text-xs text-slate-400">({lead.score_category})</span>
                </div>
              ) : (
                <button
                  onClick={() => onScoreLead(lead.id)}
                  disabled={isScoring}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white cursor-pointer"
                >
                  Score Now with AI
                </button>
              )}
            </div>

            {lead.score_details?.reason ? (
              <p className="text-xs text-slate-200 leading-relaxed font-sans bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                {lead.score_details.reason}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">
                {lead.notes || 'No assessment data available yet. Click "Score Now" to generate.'}
              </p>
            )}
          </div>

          {/* Identified Pain Points */}
          {lead.score_details?.pain_points && lead.score_details.pain_points.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Identified Operational Friction & Pain Points</span>
              </h4>
              <div className="space-y-2">
                {lead.score_details.pain_points.map((pt, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Service */}
          {lead.score_details?.suggested_service && (
            <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/50">
              <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-purple-400" />
                <span>Recommended Pitch / Service</span>
              </h4>
              <p className="text-sm font-semibold text-white mt-1">
                {lead.score_details.suggested_service}
              </p>
            </div>
          )}

          {/* Raw Operational Notes */}
          {lead.notes && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Client Profile & Intake Notes</span>
              </h4>
              <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 leading-relaxed">
                {lead.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Added on {new Date(lead.created_at).toLocaleDateString()}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenOutreach(lead);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Generate Outreach Copy</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
