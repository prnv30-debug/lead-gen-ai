import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import StatsCards from './components/StatsCards';
import ScoreChart from './components/ScoreChart';
import FiltersBar from './components/FiltersBar';
import LeadsTable from './components/LeadsTable';
import LeadsCardGrid from './components/LeadsCardGrid';
import AddLeadModal from './components/AddLeadModal';
import CsvUploadModal from './components/CsvUploadModal';
import AutoGenerateModal from './components/AutoGenerateModal';
import OutreachModal from './components/OutreachModal';
import LeadDetailsModal from './components/LeadDetailsModal';
import ChatAssistantDrawer from './components/ChatAssistantDrawer';
import ApiKeyModal from './components/ApiKeyModal';
import Toast from './components/Toast';
import { api, getStoredApiKey, setStoredApiKey } from './api';
import { Loader2, Bot, Sparkles } from 'lucide-react';

export default function App() {
  // Data state
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [city, setCity] = useState('All');
  const [type, setType] = useState('All');
  const [activeBucket, setActiveBucket] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isAutoGenerateModalOpen, setIsAutoGenerateModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Active Lead Modals
  const [selectedLeadForOutreach, setSelectedLeadForOutreach] = useState(null);
  const [selectedLeadForDetails, setSelectedLeadForDetails] = useState(null);

  // Action Loading States
  const [scoringLeadId, setScoringLeadId] = useState(null);
  const [isScoringAll, setIsScoringAll] = useState(false);
  const [isGeneratingLeads, setIsGeneratingLeads] = useState(false);
  const [isGeneratingOutreach, setIsGeneratingOutreach] = useState(false);

  // Chat State
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'assistant',
      content:
        '👋 Welcome to ApexLead AI! I have loaded your live lead database. Ask me which leads to prioritize, how to overcome objections, or draft tailored outreach.',
    },
  ]);
  const [isSendingChat, setIsSendingChat] = useState(false);

  // API Key State
  const [customKey, setCustomKey] = useState(getStoredApiKey());
  const [serverHasKey, setServerHasKey] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch initial leads and stats
  const fetchData = async () => {
    try {
      const [leadsRes, statsRes, healthRes] = await Promise.all([
        api.getLeads(),
        api.getStats(),
        api.getHealth(),
      ]);

      setLeads(leadsRes.leads || []);
      setStats(statsRes);
      setServerHasKey(Boolean(healthRes.hasApiKey));
    } catch (err) {
      console.error('Fetch error:', err);
      showToast('Error connecting to backend server', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute unique cities and types for dropdowns
  const uniqueCities = useMemo(() => {
    const set = new Set(leads.map((l) => l.city).filter(Boolean));
    return Array.from(set).sort();
  }, [leads]);

  const uniqueTypes = useMemo(() => {
    const set = new Set(leads.map((l) => l.business_type).filter(Boolean));
    return Array.from(set).sort();
  }, [leads]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        const matchName = lead.business_name.toLowerCase().includes(q);
        const matchType = lead.business_type.toLowerCase().includes(q);
        const matchCity = lead.city.toLowerCase().includes(q);
        const matchNotes = (lead.notes || '').toLowerCase().includes(q);
        if (!matchName && !matchType && !matchCity && !matchNotes) return false;
      }

      // Category Pill
      if (category !== 'All') {
        if (category === 'Unscored') {
          if (lead.score !== null && lead.score !== undefined) return false;
        } else {
          if (lead.score_category !== category) return false;
        }
      }

      // Status
      if (status !== 'All' && lead.status !== status) return false;

      // City
      if (city !== 'All' && lead.city !== city) return false;

      // Type
      if (type !== 'All' && lead.business_type !== type) return false;

      // Score Bucket (from chart click)
      if (activeBucket) {
        if (lead.score === null || lead.score === undefined) return false;
        if (activeBucket === '0-25' && lead.score > 25) return false;
        if (activeBucket === '26-50' && (lead.score < 26 || lead.score > 50)) return false;
        if (activeBucket === '51-75' && (lead.score < 51 || lead.score > 75)) return false;
        if (activeBucket === '76-100' && lead.score < 76) return false;
      }

      return true;
    });
  }, [leads, search, category, status, city, type, activeBucket]);

  const unscoredCount = useMemo(() => {
    return leads.filter((l) => l.score === null || l.score === undefined).length;
  }, [leads]);

  // Handler: Score Single Lead
  const handleScoreLead = async (leadId) => {
    setScoringLeadId(leadId);
    try {
      const res = await api.scoreLead(leadId);
      if (res.success && res.lead) {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? res.lead : l)));
        // Refresh stats
        const newStats = await api.getStats();
        setStats(newStats);

        // Update selected modals if open
        if (selectedLeadForDetails?.id === leadId) setSelectedLeadForDetails(res.lead);
        if (selectedLeadForOutreach?.id === leadId) setSelectedLeadForOutreach(res.lead);

        showToast(`AI scored ${res.lead.business_name}: ${res.lead.score}/100 (${res.lead.score_category})`);
      }
    } catch (err) {
      showToast(err.message || 'Scoring failed', 'error');
    } finally {
      setScoringLeadId(null);
    }
  };

  // Handler: Score All Leads
  const handleScoreAll = async () => {
    setIsScoringAll(true);
    try {
      const res = await api.scoreAllLeads();
      if (res.success) {
        setLeads(res.leads);
        const newStats = await api.getStats();
        setStats(newStats);
        showToast(res.message || 'All leads scored successfully!');
      }
    } catch (err) {
      showToast(err.message || 'Batch scoring failed', 'error');
    } finally {
      setIsScoringAll(false);
    }
  };

  // Handler: Generate Outreach
  const handleGenerateOutreach = async (leadId, tone = 'friendly') => {
    setIsGeneratingOutreach(true);
    try {
      const res = await api.generateOutreach(leadId, tone);
      if (res.success && res.lead) {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? res.lead : l)));
        if (selectedLeadForOutreach?.id === leadId) setSelectedLeadForOutreach(res.lead);
        showToast(`Generated personalized ${tone} outreach!`);
      }
    } catch (err) {
      showToast(err.message || 'Failed to generate outreach', 'error');
    } finally {
      setIsGeneratingOutreach(false);
    }
  };

  // Handler: Add Single Lead
  const handleAddLead = async (leadData) => {
    const res = await api.createLead(leadData);
    if (res.success && res.lead) {
      setLeads((prev) => [res.lead, ...prev]);
      const newStats = await api.getStats();
      setStats(newStats);
      showToast(`Added ${res.lead.business_name}`);

      // If autoScore was checked
      if (leadData.autoScore) {
        handleScoreLead(res.lead.id);
      }
    }
  };

  // Handler: Bulk Upload
  const handleBulkUpload = async (incomingLeads) => {
    const res = await api.createBulkLeads(incomingLeads);
    if (res.success) {
      await fetchData();
      showToast(`Imported ${res.count} leads successfully!`);
    }
  };

  // Handler: Auto-Generate Leads
  const handleAutoGenerate = async (industry, targetCity) => {
    setIsGeneratingLeads(true);
    try {
      const res = await api.autoGenerateLeads(industry, targetCity);
      if (res.success) {
        await fetchData();
        showToast(`Synthesized 10 realistic leads for ${industry} in ${targetCity}!`);
      }
    } catch (err) {
      showToast(err.message || 'Lead auto-generation failed', 'error');
    } finally {
      setIsGeneratingLeads(false);
    }
  };

  // Handler: Status change
  const handleStatusChange = async (leadId, newStatus) => {
    try {
      const res = await api.updateLead(leadId, { status: newStatus });
      if (res.success && res.lead) {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? res.lead : l)));
        const newStats = await api.getStats();
        setStats(newStats);
        showToast(`Status updated to "${newStatus}"`);
      }
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  // Handler: Delete lead
  const handleDeleteLead = async (leadId) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    try {
      await api.deleteLead(leadId);
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      const newStats = await api.getStats();
      setStats(newStats);
      showToast('Lead deleted');
    } catch (err) {
      showToast('Failed to delete lead', 'error');
    }
  };

  // Handler: Send Chat Message
  const handleSendMessage = async (msgText) => {
    const userMsg = { role: 'user', content: msgText };
    setChatHistory((prev) => [...prev, userMsg]);
    setIsSendingChat(true);

    try {
      const res = await api.chat(msgText, chatHistory);
      if (res.success) {
        setChatHistory((prev) => [
          ...prev,
          { role: 'assistant', content: res.reply },
        ]);
      }
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error communicating with Gemini. Please verify your API key.',
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  // Handler: Save API key
  const handleSaveApiKey = (newKey) => {
    setStoredApiKey(newKey);
    setCustomKey(newKey);
    showToast('Gemini API settings updated');
  };

  // Handler: Reset demo data
  const handleResetDemo = async () => {
    try {
      const res = await api.resetDemoLeads();
      if (res.success) {
        await fetchData();
        showToast('Reset to 5 initial demo leads!');
      }
    } catch (err) {
      showToast('Failed to reset demo data', 'error');
    }
  };

  // Open outreach modal
  const handleOpenOutreach = (lead) => {
    setSelectedLeadForOutreach(lead);
    // If outreach is missing, generate immediately
    if (!lead.outreach?.friendly && !lead.outreach?.professional) {
      handleGenerateOutreach(lead.id, 'friendly');
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      {/* Navbar */}
      <Navbar
        hasApiKey={serverHasKey}
        customKey={customKey}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenCsvModal={() => setIsCsvModalOpen(true)}
        onOpenAutoGenerateModal={() => setIsAutoGenerateModalOpen(true)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onResetDemo={handleResetDemo}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        isChatOpen={isChatOpen}
        leadCount={leads.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top KPI Cards */}
        <StatsCards
          stats={stats}
          onFilterCategory={(cat) => setCategory(cat)}
          currentCategory={category}
        />

        {/* Score Distribution Bar Chart */}
        <ScoreChart
          buckets={stats?.buckets || []}
          total={stats?.total || 0}
          onSelectBucket={(b) => setActiveBucket(b)}
          activeBucket={activeBucket}
        />

        {/* Search & Filters */}
        <FiltersBar
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
          status={status}
          onStatusChange={setStatus}
          city={city}
          onCityChange={setCity}
          type={type}
          onTypeChange={setType}
          cities={uniqueCities}
          types={uniqueTypes}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onScoreAll={handleScoreAll}
          isScoringAll={isScoringAll}
          unscoredCount={unscoredCount}
        />

        {/* Leads Listing */}
        {isLoading ? (
          <div className="glass-card rounded-xl border border-slate-800 p-16 text-center">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">Loading lead intelligence pipeline...</p>
          </div>
        ) : viewMode === 'table' ? (
          <LeadsTable
            leads={filteredLeads}
            scoringLeadId={scoringLeadId}
            onScoreLead={handleScoreLead}
            onOpenOutreach={handleOpenOutreach}
            onOpenDetails={(l) => setSelectedLeadForDetails(l)}
            onDeleteLead={handleDeleteLead}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <LeadsCardGrid
            leads={filteredLeads}
            scoringLeadId={scoringLeadId}
            onScoreLead={handleScoreLead}
            onOpenOutreach={handleOpenOutreach}
            onOpenDetails={(l) => setSelectedLeadForDetails(l)}
            onDeleteLead={handleDeleteLead}
            onStatusChange={handleStatusChange}
          />
        )}
      </main>

      {/* Floating Action / Chat Button (Bottom Right) */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-xs shadow-xl shadow-purple-600/30 hover:scale-105 transition-all cursor-pointer"
        >
          <Bot className="w-4 h-4" />
          <span>Ask AI Copilot</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
        </button>
      )}

      {/* Modals & Drawers */}
      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddLead={handleAddLead}
      />

      <CsvUploadModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onBulkUpload={handleBulkUpload}
      />

      <AutoGenerateModal
        isOpen={isAutoGenerateModalOpen}
        onClose={() => setIsAutoGenerateModalOpen(false)}
        onGenerateLeads={handleAutoGenerate}
        isGenerating={isGeneratingLeads}
      />

      <OutreachModal
        lead={selectedLeadForOutreach}
        isOpen={Boolean(selectedLeadForOutreach)}
        onClose={() => setSelectedLeadForOutreach(null)}
        onGenerateOutreach={handleGenerateOutreach}
        isGenerating={isGeneratingOutreach}
      />

      <LeadDetailsModal
        lead={selectedLeadForDetails}
        isOpen={Boolean(selectedLeadForDetails)}
        onClose={() => setSelectedLeadForDetails(null)}
        onOpenOutreach={handleOpenOutreach}
        onScoreLead={handleScoreLead}
        isScoring={Boolean(scoringLeadId)}
      />

      <ChatAssistantDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        leads={leads}
        onSendMessage={handleSendMessage}
        chatHistory={chatHistory}
        isSending={isSendingChat}
        onClearChat={() =>
          setChatHistory([
            {
              role: 'assistant',
              content: 'Chat cleared. How can I help you analyze your leads?',
            },
          ])
        }
      />

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        currentKey={customKey}
        serverHasKey={serverHasKey}
        onSaveKey={handleSaveApiKey}
        onResetDemo={handleResetDemo}
      />

      {/* Toast Feedback */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
