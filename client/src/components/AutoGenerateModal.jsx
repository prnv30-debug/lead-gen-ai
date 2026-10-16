import React, { useState } from 'react';
import { X, Sparkles, Loader2, Compass, MapPin, Building2 } from 'lucide-react';

export default function AutoGenerateModal({ isOpen, onClose, onGenerateLeads, isGenerating }) {
  const [industry, setIndustry] = useState('Dental Clinics');
  const [city, setCity] = useState('Austin, TX');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const presets = [
    { industry: 'Dental & Orthodontic Clinics', city: 'Austin, TX' },
    { industry: 'Poultry Farms & Agricultural Supply', city: 'Des Moines, IA' },
    { industry: 'CrossFit & Functional Fitness Gyms', city: 'Dallas, TX' },
    { industry: 'HVAC & Plumbing Contractors', city: 'Phoenix, AZ' },
    { industry: 'Boutique Coffee Roasteries & Cafes', city: 'Seattle, WA' },
    { industry: 'Commercial Roofing & Construction', city: 'Atlanta, GA' },
  ];

  const handleApplyPreset = (p) => {
    setIndustry(p.industry);
    setCity(p.city);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!industry.trim() || !city.trim()) {
      setError('Please provide both an industry and city.');
      return;
    }

    setError('');
    try {
      await onGenerateLeads(industry.trim(), city.trim());
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to auto-generate leads');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Gemini Lead Generator</h3>
              <p className="text-xs text-slate-400">Produce 10 hyper-realistic B2B leads instantly</p>
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
        <form onSubmit={handleGenerate} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-purple-400" />
              <span>Or Choose a High-ROI Preset Industry & Market:</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleApplyPreset(p)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    industry === p.industry && city === p.city
                      ? 'bg-purple-900/60 text-purple-200 border-purple-600'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {p.industry} ({p.city})
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Target Industry / Business Niche <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Poultry Farms, Dental Clinics, Law Firms"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Target City / Geographical Area <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Austin, TX or London, UK"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-purple-300 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Data Generation Mechanics:</span>
            </div>
            <p>
              Gemini will generate 10 distinct, realistic businesses with authentic business names, realistic pain point notes, staff signals, and website links ready for automated scoring.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-purple-600/30"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing 10 Leads...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate 10 Leads</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
