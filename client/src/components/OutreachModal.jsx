import React, { useState } from 'react';
import {
  X,
  Send,
  Mail,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Loader2,
  MessageSquare,
  ThumbsUp,
  Briefcase
} from 'lucide-react';

export default function OutreachModal({
  lead,
  isOpen,
  onClose,
  onGenerateOutreach,
  isGenerating,
}) {
  const [activeTab, setActiveTab] = useState('whatsapp'); // 'whatsapp' | 'email'
  const [selectedTone, setSelectedTone] = useState('friendly'); // 'friendly' | 'professional'
  const [copiedType, setCopiedType] = useState(null); // 'whatsapp' | 'subject' | 'body' | null

  if (!isOpen || !lead) return null;

  // Retrieve current outreach copy for this tone or fallback
  const currentOutreach = lead.outreach?.[selectedTone] || lead.outreach?.friendly || lead.outreach?.professional || null;
  const whatsappText = currentOutreach?.whatsapp || '';
  const emailFull = currentOutreach?.email || '';

  // Parse subject and body from emailFull if available
  let emailSubject = `Quick thought regarding ${lead.business_name}'s workflow`;
  let emailBody = emailFull;

  if (emailFull.includes('Subject:')) {
    const lines = emailFull.split('\n');
    const subjLine = lines.find((l) => l.trim().startsWith('Subject:'));
    if (subjLine) {
      emailSubject = subjLine.replace('Subject:', '').trim();
      emailBody = lines.filter((l) => !l.trim().startsWith('Subject:')).join('\n').trim();
    }
  }

  const handleCopy = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleToneChange = (tone) => {
    setSelectedTone(tone);
    if (!lead.outreach?.[tone]) {
      onGenerateOutreach(lead.id, tone);
    }
  };

  const handleWhatsAppWeb = () => {
    const textEncoded = encodeURIComponent(whatsappText);
    window.open(`https://api.whatsapp.com/send?text=${textEncoded}`, '_blank');
  };

  const handleMailto = () => {
    const subjEncoded = encodeURIComponent(emailSubject);
    const bodyEncoded = encodeURIComponent(emailBody);
    window.open(`mailto:?subject=${subjEncoded}&body=${bodyEncoded}`, '_self');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">AI Outreach Generator</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {lead.business_name}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {lead.business_type} • {lead.city} • AI Score: <strong className="text-emerald-400">{lead.score ?? 'N/A'}/100</strong>
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

        {/* Tone Selector & Tab Header */}
        <div className="px-5 pt-4 pb-2 border-b border-slate-800/80 bg-slate-950/30 flex flex-wrap items-center justify-between gap-3">
          {/* Channel Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'whatsapp'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Message</span>
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'email'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Cold Email</span>
            </button>
          </div>

          {/* Tone Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Tone:</span>
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => handleToneChange('friendly')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  selectedTone === 'friendly'
                    ? 'bg-slate-800 text-amber-300 border border-amber-900/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <ThumbsUp className="w-3 h-3" />
                <span>Friendly</span>
              </button>
              <button
                onClick={() => handleToneChange('professional')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  selectedTone === 'professional'
                    ? 'bg-slate-800 text-cyan-300 border border-cyan-900/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <Briefcase className="w-3 h-3" />
                <span>Professional</span>
              </button>
            </div>

            <button
              onClick={() => onGenerateOutreach(lead.id, selectedTone)}
              disabled={isGenerating}
              className="p-1.5 rounded-lg bg-slate-800 text-purple-400 border border-purple-900/50 hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer ml-1"
              title="Regenerate copy with Gemini"
            >
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Modal Body: Channel Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {isGenerating ? (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              <p className="text-sm font-semibold text-slate-200">Gemini is drafting personalized {selectedTone} outreach...</p>
              <p className="text-xs text-slate-500">Injecting business context, operational pain points & tone guidelines.</p>
            </div>
          ) : activeTab === 'whatsapp' ? (
            /* WhatsApp Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Direct WhatsApp DM Preview</span>
                <span>{whatsappText.length} characters</span>
              </div>

              {/* Realistic WhatsApp Chat Bubble Container */}
              <div className="bg-[#0b141a] p-4 rounded-xl border border-slate-800 relative">
                <div className="max-w-[85%] bg-[#005c4b] text-[#e9edef] p-3.5 rounded-2xl rounded-tl-sm text-sm shadow-md leading-relaxed whitespace-pre-wrap font-sans">
                  {whatsappText || 'Click Regenerate to draft a personalized WhatsApp message for this lead.'}
                  <div className="text-[10px] text-emerald-200/70 text-right mt-1">11:42 AM ✓✓</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <button
                  onClick={handleWhatsAppWeb}
                  disabled={!whatsappText}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#25D366] text-slate-950 hover:bg-[#20ba59] transition-all cursor-pointer disabled:opacity-50"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in WhatsApp Web</span>
                </button>

                <button
                  onClick={() => handleCopy(whatsappText, 'whatsapp')}
                  disabled={!whatsappText}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 transition-all cursor-pointer disabled:opacity-50"
                >
                  {copiedType === 'whatsapp' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy WhatsApp Message</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Cold Email Tab */
            <div className="space-y-4">
              {/* Subject Line Field */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span className="font-semibold text-slate-300">Subject Line:</span>
                  <button
                    onClick={() => handleCopy(emailSubject, 'subject')}
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedType === 'subject' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedType === 'subject' ? 'Copied' : 'Copy Subject'}</span>
                  </button>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-medium text-white">
                  {emailSubject}
                </div>
              </div>

              {/* Email Body Field */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span className="font-semibold text-slate-300">Email Body:</span>
                  <button
                    onClick={() => handleCopy(emailBody, 'body')}
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedType === 'body' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedType === 'body' ? 'Copied' : 'Copy Body'}</span>
                  </button>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans max-h-60 overflow-y-auto">
                  {emailBody || 'Click Regenerate to craft personalized email copy.'}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <button
                  onClick={handleMailto}
                  disabled={!emailBody}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-500 transition-all cursor-pointer disabled:opacity-50"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Mail Client</span>
                </button>

                <button
                  onClick={() => handleCopy(`Subject: ${emailSubject}\n\n${emailBody}`, 'all-email')}
                  disabled={!emailBody}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 transition-all cursor-pointer disabled:opacity-50"
                >
                  {copiedType === 'all-email' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Full Email Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Full Email</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
