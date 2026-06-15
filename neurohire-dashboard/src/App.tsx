import React, { useState } from 'react';
import { ChevronLeft, Mail, FileText, Send, Copy, Check, Download, AlertCircle, RefreshCw } from 'lucide-react';
import Sidebar from './components/Sidebar';
import MetricCards from './components/MetricCards';
import AppTable from './components/AppTable';
import AgentPanel from './components/AgentPanel';
import FitScoreBar from './components/FitScoreBar';
import ClaimsTrace from './components/ClaimsTrace';
import CompanyIntel from './components/CompanyIntel';

import {
  useApplicationDetailQuery,
  useProfileQuery,
  useSaveProfileMutation,
  useUpdateStatusMutation,
  useMcpStatusQuery
} from './hooks/useTracker';

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'app' | 'settings'>('dashboard');
  const [selectedAppId, setSelectedAppId] = useState<string | null>("6503e116-27c3-4647-b013-72c7736b608b");
  const [copiedText, setCopiedText] = useState<'email' | 'letter' | 'referral' | null>(null);

  // Queries
  const { data: detailData, isLoading: isDetailLoading, refetch: refetchDetail } = useApplicationDetailQuery(selectedAppId || '');
  const { data: profileData, isLoading: isProfileLoading, refetch: refetchProfile } = useProfileQuery();
  const { data: mcpStatus, refetch: refetchMcp } = useMcpStatusQuery();

  // Mutations
  const saveProfileMutation = useSaveProfileMutation();
  const updateStatusMutation = useUpdateStatusMutation();

  // Settings page JSON editor state
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleNavigate = (view: 'dashboard' | 'app' | 'settings', id?: string) => {
    setCurrentView(view);
    if (id) {
      setSelectedAppId(id);
    }
  };

  const handleSelectApp = (id: string) => {
    setSelectedAppId(id);
    setCurrentView('app');
  };

  const copyToClipboard = (text: string, type: 'email' | 'letter' | 'referral') => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleJsonChange = (val: string) => {
    setJsonText(val);
    try {
      JSON.parse(val);
      setJsonError(null);
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON format');
    }
  };

  const handleSaveProfile = async () => {
    if (jsonError) return;
    try {
      const parsed = JSON.parse(jsonText);
      await saveProfileMutation.mutateAsync(parsed);
      setIsEditing(false);
      refetchProfile();
    } catch (err: any) {
      setJsonError(err.message || 'Failed to save profile');
    }
  };

  const startJsonEdit = () => {
    if (profileData) {
      setJsonText(JSON.stringify(profileData, null, 2));
      setJsonError(null);
      setIsEditing(true);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (selectedAppId) {
      await updateStatusMutation.mutateAsync({ id: selectedAppId, status: newStatus });
      refetchDetail();
    }
  };

  // Mock resume PDF render callback
  const handlePdfDownload = () => {
    alert("Triggered resume-render.ts PDF Compilation. Downloading tailored PDF template document...");
  };

  return (
    <div className="flex bg-[#05070c] min-h-screen text-slate-200">
      {/* Sidebar Nav */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        selectedId={selectedAppId}
      />

      {/* Main Workspace Frame */}
      <main className="flex-1 overflow-y-auto h-screen p-8 space-y-8">
        
        {/* VIEW 1: DASHBOARD HOME */}
        {currentView === 'dashboard' && (
          <div className="space-y-8 animate-slide-in">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-5">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-white">Recruitment Workspace</h1>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
                  Active Applications & Live Agent Pipeline
                </p>
              </div>
              {import.meta.env.VITE_MOCK === 'true' && (
                <span className="text-[10px] font-bold tracking-widest bg-purple-500/10 border border-purple-500/20 text-purple-400 px-3 py-1 rounded-full uppercase">
                  Mock Mode Active
                </span>
              )}
            </div>

            {/* Metrics */}
            <MetricCards />

            {/* Core Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Applications List Table */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">Application Tracker</h2>
                </div>
                <AppTable onSelectApplication={handleSelectApp} />
              </div>

              {/* Agent Console */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">Live Agent Streaming</h2>
                </div>
                <AgentPanel />
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: SINGLE APPLICATION DETAILS */}
        {currentView === 'app' && (
          <div className="space-y-6 animate-slide-in">
            {/* Back header */}
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="p-2 rounded-lg border border-[#1e293b] bg-[#0b0f19] text-slate-400 hover:text-white hover:border-slate-500 transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <div>
                  <h1 className="text-xl font-extrabold text-white">
                    {detailData?.application.company || 'Loading Company...'}
                  </h1>
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                    {detailData?.application.role || 'Loading Role...'}
                  </span>
                </div>
              </div>

              {/* Application Details Actions / Status selectors */}
              {detailData && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Status:</span>
                  <select
                    id="details-status-change"
                    value={detailData.application.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#0d1321]/60 border border-[#1e293b] text-xs font-bold text-slate-300 focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="applied">Applied</option>
                    <option value="interview">Interview</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              )}
            </div>

            {isDetailLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
              </div>
            ) : detailData ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Large Column (Drafts, Bullets, Claims) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Tailored outreach drafts */}
                  <div className="rounded-xl border border-[#1e293b] bg-[#0d1321]/60 p-5 space-y-5">
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Generated Outreach Material</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        AI customized copy prepared for candidate cold communications.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Cold Email block */}
                      <div className="rounded-lg border border-[#1e293b]/70 bg-[#070b13]/50 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2.5 bg-[#0b0f19] border-b border-[#1e293b]/70">
                          <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                            <Mail size={13} className="text-purple-400" />
                            Cold Email Pitch
                          </span>
                          <button
                            onClick={() => copyToClipboard(
                              `Subject: ${detailData.outreach_draft.cold_email.subject}\n\n${detailData.outreach_draft.cold_email.body}`,
                              'email'
                            )}
                            className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-white transition-colors focus:outline-none"
                          >
                            {copiedText === 'email' ? (
                              <>
                                <Check size={11} className="text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={11} />
                                <span>Copy Draft</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="p-4 space-y-2.5 text-xs">
                          <div>
                            <span className="font-bold text-slate-500 mr-2">Subject:</span>
                            <span className="text-slate-200 font-medium">{detailData.outreach_draft.cold_email.subject}</span>
                          </div>
                          <pre className="font-sans text-slate-300 font-medium whitespace-pre-wrap leading-relaxed border-t border-[#1e293b]/30 pt-2.5">
                            {detailData.outreach_draft.cold_email.body}
                          </pre>
                        </div>
                      </div>

                      {/* Cover letter block */}
                      {detailData.outreach_draft.cover_letter_paragraphs.length > 0 && (
                        <div className="rounded-lg border border-[#1e293b]/70 bg-[#070b13]/50 overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-2.5 bg-[#0b0f19] border-b border-[#1e293b]/70">
                            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                              <FileText size={13} className="text-purple-400" />
                              Cover Letter Paragraphs
                            </span>
                            <button
                              onClick={() => copyToClipboard(
                                detailData.outreach_draft.cover_letter_paragraphs.join('\n\n'),
                                'letter'
                              )}
                              className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-white transition-colors focus:outline-none"
                            >
                              {copiedText === 'letter' ? (
                                <>
                                  <Check size={11} className="text-emerald-400" />
                                  <span className="text-emerald-400">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={11} />
                                  <span>Copy Letter</span>
                                </>
                              )}
                            </button>
                          </div>
                          <div className="p-4 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-medium space-y-3">
                            {detailData.outreach_draft.cover_letter_paragraphs.map((p, idx) => (
                              <p key={idx}>{p}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Referral pitch block */}
                      {detailData.outreach_draft.referral_message && (
                        <div className="rounded-lg border border-[#1e293b]/70 bg-[#070b13]/50 overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-2.5 bg-[#0b0f19] border-b border-[#1e293b]/70">
                            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                              <Send size={13} className="text-purple-400" />
                              LinkedIn / Referral Message
                            </span>
                            <button
                              onClick={() => copyToClipboard(detailData.outreach_draft.referral_message!, 'referral')}
                              className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-white transition-colors focus:outline-none"
                            >
                              {copiedText === 'referral' ? (
                                <>
                                  <Check size={11} className="text-emerald-400" />
                                  <span className="text-emerald-400">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={11} />
                                  <span>Copy Message</span>
                                </>
                              )}
                            </button>
                          </div>
                          <div className="p-4 text-xs text-slate-300 whitespace-pre-wrap font-medium leading-relaxed">
                            {detailData.outreach_draft.referral_message}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tailored bullets compare view */}
                  <div className="rounded-xl border border-[#1e293b] bg-[#0d1321]/60 p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#1e293b]/70 pb-3">
                      <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tailored Resume Bullets</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Tailoring differences matching the baseline profile ground truth.
                        </p>
                      </div>
                      <button
                        onClick={handlePdfDownload}
                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-all shadow"
                      >
                        <Download size={13} />
                        <span>Download PDF</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {detailData.tailored_bullets.map((bullet, index) => {
                        // Diff simulator
                        const isSentix = bullet.project_or_role.includes("Sentixcare");
                        const originalBullet = isSentix 
                          ? "Built emotion classification pipelines using Python, CNN, OpenCV."
                          : "Constructed frontend views using React and mapped database APIs.";
                          
                        return (
                          <div key={index} className="space-y-2 p-3 rounded-lg bg-[#070b13]/30 border border-[#1e293b]/50">
                            <span className="text-xs font-bold text-purple-400">{bullet.project_or_role}</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              {/* Original */}
                              <div className="p-3.5 rounded bg-rose-950/10 border border-rose-500/10 text-rose-300/80">
                                <span className="block font-bold text-[9px] uppercase tracking-wider text-rose-500 mb-1">Original</span>
                                <p className="font-medium line-through decoration-rose-500/30">{originalBullet}</p>
                              </div>
                              {/* Tailored */}
                              <div className="p-3.5 rounded bg-emerald-950/10 border border-emerald-500/10 text-emerald-300">
                                <span className="block font-bold text-[9px] uppercase tracking-wider text-emerald-500 mb-1">Tailored (Adjudicated)</span>
                                <p className="font-semibold">{bullet.bullet}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Claims checklist */}
                  <ClaimsTrace claims={detailData.claims} />
                </div>

                {/* Right Small Column (Fit score, Company intel) */}
                <div className="space-y-6">
                  <FitScoreBar score={detailData.application.fit_score} />
                  <CompanyIntel intel={detailData.company_intel} />
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500">
                Application not found.
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: PROFILE JSON CONFIG */}
        {currentView === 'settings' && (
          <div className="space-y-6 animate-slide-in">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-5">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-white">Candidate Settings</h1>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
                  JSON Editor & Microservice Statuses
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Editor */}
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-xl border border-[#1e293b] bg-[#0d1321]/60 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Candidate Baseline Profile</h3>
                      <p className="text-xs text-slate-400 mt-1 font-medium">
                        This represents the candidate ground truth data (profile.json) that feeds into LLM validation.
                      </p>
                    </div>
                    {!isEditing && (
                      <button
                        onClick={startJsonEdit}
                        className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-all shadow"
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>

                  {/* JSON Editor panel */}
                  {isEditing ? (
                    <div className="space-y-4">
                      {jsonError && (
                        <div className="flex items-center gap-3 p-3.5 rounded-lg border border-rose-500/30 bg-rose-500/5 text-xs text-rose-400">
                          <AlertCircle size={16} />
                          <span className="font-semibold">{jsonError}</span>
                        </div>
                      )}
                      <textarea
                        id="profile-json-textarea"
                        value={jsonText}
                        onChange={(e) => handleJsonChange(e.target.value)}
                        rows={16}
                        className="w-full p-4 rounded-lg bg-[#070b13] border border-[#1e293b] font-mono text-xs text-purple-300 placeholder-slate-700 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 leading-relaxed"
                      />
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 rounded-lg border border-[#1e293b] bg-[#0b0f19] text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#161f30] transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          disabled={!!jsonError || saveProfileMutation.isPending}
                          className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold text-white transition-all shadow"
                        >
                          {saveProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  ) : isProfileLoading ? (
                    <div className="h-64 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full border-3 border-purple-500 border-t-transparent animate-spin" />
                    </div>
                  ) : (
                    <pre className="p-4 rounded-lg bg-[#070b13]/80 border border-[#1e293b] overflow-x-auto text-xs text-slate-300 leading-relaxed font-mono whitespace-pre max-h-[400px]">
                      {JSON.stringify(profileData, null, 2)}
                    </pre>
                  )}
                </div>
              </div>

              {/* MCP Status Sidebar list */}
              <div className="space-y-4">
                <div className="rounded-xl border border-[#1e293b] bg-[#0d1321]/60 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#1e293b]/70 pb-3">
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">MCP Server Cluster</h3>
                    <button
                      onClick={() => refetchMcp()}
                      className="p-1 rounded-md border border-[#1e293b] bg-[#0b0f19] text-slate-400 hover:text-white"
                      title="Re-check status"
                    >
                      <RefreshCw size={13} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {mcpStatus ? (
                      Object.entries(mcpStatus).map(([name, status]) => (
                        <div
                          key={name}
                          className="flex items-center justify-between p-3 rounded-lg bg-[#070b13]/40 border border-[#1e293b]/40 text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-200 block">{name}</span>
                            <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">
                              {name === 'resume-mcp' && 'Candidate Profile Reader'}
                              {name === 'jd-parser-mcp' && 'Job Description Signal Extractor'}
                              {name === 'tracker-mcp' && 'Supabase Application Sync'}
                              {name === 'company-intel-mcp' && 'Wikidata & DuckDuckgo Intel'}
                              {name === 'outreach-mcp' && 'Gemini Tailored Cover Letter/Email'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border capitalize ${
                              status === 'healthy' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : status === 'unhealthy'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                            }`}>
                              {status}
                            </span>
                            <div className={`w-2 h-2 rounded-full ${
                              status === 'healthy' 
                                ? 'bg-emerald-500 shadow-md shadow-emerald-500/50' 
                                : status === 'unhealthy'
                                ? 'bg-rose-500 shadow-md shadow-rose-500/50'
                                : 'bg-slate-500'
                            }`} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-5 text-slate-500 text-xs">
                        Checking server statuses...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
