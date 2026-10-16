import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Download, Loader2, Building2 } from 'lucide-react';

export default function CsvUploadModal({ isOpen, onClose, onBulkUpload }) {
  const [parsedLeads, setParsedLeads] = useState([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Simple, robust CSV parser supporting quotes and commas
  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('CSV must contain a header row and at least one data row.');
    }

    // Split row respecting quotes
    const splitRow = (row) => {
      const result = [];
      let current = '';
      let insideQuote = false;

      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"' || char === "'") {
          insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
          result.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      return result;
    };

    const headers = splitRow(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9_]/g, ''));

    // Map headers to fields
    const nameIdx = headers.findIndex((h) => h.includes('name') || h.includes('business') || h.includes('company'));
    const typeIdx = headers.findIndex((h) => h.includes('type') || h.includes('industry') || h.includes('category'));
    const cityIdx = headers.findIndex((h) => h.includes('city') || h.includes('location'));
    const webIdx = headers.findIndex((h) => h.includes('web') || h.includes('url') || h.includes('site'));
    const notesIdx = headers.findIndex((h) => h.includes('note') || h.includes('context') || h.includes('desc'));

    if (nameIdx === -1) {
      throw new Error('Could not find a "Business Name" or "Company" column in header row.');
    }

    const leads = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = splitRow(lines[i]);
      if (cols.length === 0 || !cols[nameIdx]) continue;

      leads.push({
        business_name: cols[nameIdx] || '',
        business_type: typeIdx !== -1 ? cols[typeIdx] : 'Commercial Service',
        city: cityIdx !== -1 ? cols[cityIdx] : 'Unknown City',
        website: webIdx !== -1 ? cols[webIdx] : '',
        notes: notesIdx !== -1 ? cols[notesIdx] : '',
      });
    }

    return leads;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        const leads = parseCSV(content);
        if (leads.length === 0) {
          throw new Error('No valid leads found in file.');
        }
        setParsedLeads(leads);
      } catch (err) {
        setError(err.message || 'Failed to parse CSV file');
        setParsedLeads([]);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmUpload = async () => {
    if (parsedLeads.length === 0) return;
    setIsUploading(true);
    try {
      await onBulkUpload(parsedLeads);
      setParsedLeads([]);
      setFileName('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to upload leads');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadSampleCsv = () => {
    const sample = `business_name,business_type,city,website,notes
"Bright Dental Care","Dental Clinic","Denver, CO","https://brightdental.example.com","3 dentists, manual appointment reminder calls, 20% no-shows."
"Highland Farm & Feed","Poultry & Farm Supply","Lincoln, NE","https://highlandfeed.example.com","Wholesale farm distributor taking orders by text message."
"Urban Core Fitness","CrossFit Gym","Seattle, WA","https://urbancorefitness.example.com","High trial signup rate but low follow-up conversion."`;

    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_leads.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Bulk CSV Lead Upload</h3>
              <p className="text-xs text-slate-400">Import dozens of leads at once</p>
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
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-purple-500 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-950/40 hover:bg-slate-900/60"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,text/csv"
              className="hidden"
            />
            <FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-white mb-1">
              {fileName ? fileName : 'Click to select CSV file'}
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              Supports columns: <code className="text-purple-300">business_name, business_type, city, website, notes</code>
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                downloadSampleCsv();
              }}
              className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download sample CSV template</span>
            </button>
          </div>

          {/* Preview Table */}
          {parsedLeads.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Ready to import {parsedLeads.length} leads
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Business</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">City</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {parsedLeads.slice(0, 10).map((l, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-medium text-white">{l.business_name}</td>
                        <td className="py-2 px-3">{l.business_type}</td>
                        <td className="py-2 px-3">{l.city}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedLeads.length > 10 && (
                <p className="text-[11px] text-slate-500 mt-1 italic">
                  + {parsedLeads.length - 10} more leads will be imported.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-2 bg-slate-950/40">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmUpload}
            disabled={parsedLeads.length === 0 || isUploading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Import {parsedLeads.length > 0 ? `${parsedLeads.length} Leads` : ''}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
