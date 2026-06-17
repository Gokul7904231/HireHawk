import { useState, useEffect } from 'react';
import { ChevronLeft, Mail, FileText, Send, Copy, Check, Download, AlertCircle, RefreshCw } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AgentPanel from './components/AgentPanel';
import FitScoreBar from './components/FitScoreBar';
import ClaimsTrace from './components/ClaimsTrace';
import CompanyIntel from './components/CompanyIntel';
import LoginSignup from './components/LoginSignup';
import Dashboard from './pages/Dashboard';
import { Profile } from './types';
import { ProfileForm } from './components/ProfileForm';

import {
  useApplicationDetailQuery,
  useProfileQuery,
  useSaveProfileMutation,
  useUpdateStatusMutation,
  useMcpStatusQuery
} from './hooks/useTracker';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('hirehawk_auth') === 'true';
  });
  const [currentView, setCurrentView] = useState<'dashboard' | 'app' | 'settings'>('dashboard');
  const [selectedAppId, setSelectedAppId] = useState<string | null>("6503e116-27c3-4647-b013-72c7736b608b");

  // Validate session on mount
  useEffect(() => {
    const token = localStorage.getItem('hirehawk_auth_token');
    if (token) {
      import('./api/tracker').then(({ validateSession }) => {
        validateSession(token)
          .then((res) => {
            if (res.valid) {
              localStorage.setItem('hirehawk_user_email', res.user.email);
              localStorage.setItem('hirehawk_user_name', res.user.name);
              localStorage.setItem('hirehawk_user_role', res.user.role);
            } else {
              handleLogout();
            }
          })
          .catch(() => {
            handleLogout();
          });
      });
    } else if (isAuthenticated) {
      handleLogout();
    }
  }, []);

  const handleLogout = () => {
    const token = localStorage.getItem('hirehawk_auth_token');
    if (token) {
      import('./api/tracker').then(({ logoutUser }) => {
        logoutUser(token).catch(() => {});
      });
    }
    localStorage.removeItem('hirehawk_auth');
    localStorage.removeItem('hirehawk_auth_token');
    localStorage.removeItem('hirehawk_user_email');
    localStorage.removeItem('hirehawk_user_name');
    localStorage.removeItem('hirehawk_user_role');
    setIsAuthenticated(false);
  };
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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleNavigate = (view: 'dashboard' | 'app' | 'settings', id?: string) => {
    setCurrentView(view);
    if (id) {
      setSelectedAppId(id);
    }
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

  const handleSaveProfile = async (updatedProfile: Profile) => {
    try {
      await saveProfileMutation.mutateAsync(updatedProfile);
      setIsEditing(false);
      refetchProfile();
      setToast({ message: 'Candidate profile saved successfully!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setJsonError(err.message || 'Failed to save profile');
      setToast({ message: err.message || 'Failed to save profile', type: 'error' });
      setTimeout(() => setToast(null), 4000);
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

  if (!isAuthenticated) {
    return <LoginSignup onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex bg-surface h-screen text-on-surface font-sans overflow-hidden">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        selectedId={selectedAppId}
        onLogout={handleLogout}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col ml-[240px] h-screen overflow-hidden">
        {/* Persistent Top AppBar Header */}
        <Header onSearchChange={(term) => {
          const event = new CustomEvent('global-search', { detail: term });
          window.dispatchEvent(event);
        }} />

        {/* Dynamic Canvas Container (scrolls independently) */}
        <div className="flex-1 overflow-y-auto bg-surface-container-lowest/10 custom-scrollbar p-margin-desktop space-y-8 animate-slide-in">
          
          {/* VIEW 1: DASHBOARD PAGE */}
          {currentView === 'dashboard' && (
            <Dashboard onNavigate={handleNavigate} />
          )}

          {/* VIEW 2: SINGLE APPLICATION DETAILS */}
          {currentView === 'app' && (
            <div className="space-y-6">
              {/* Back header */}
              <div className="flex items-center justify-between border-b border-outline-variant pb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className="p-2 rounded-btn border border-outline-variant bg-surface-container-low text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-all"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div>
                    <h1 className="font-headline text-xl font-extrabold text-on-surface">
                      {detailData?.application.company || 'Loading Company...'}
                    </h1>
                    <span className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider mt-0.5">
                      {detailData?.application.role || 'Loading Role...'}
                    </span>
                  </div>
                </div>

                {/* Application Details Actions / Status selectors */}
                {detailData && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-headline font-bold text-on-surface-variant uppercase">Status:</span>
                    <select
                      id="details-status-change"
                      value={detailData.application.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="px-3 py-1.5 rounded-btn bg-surface-container-low border border-outline-variant text-xs font-bold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer font-medium"
                    >
                      <option className="bg-surface-container" value="applied">Applied</option>
                      <option className="bg-surface-container" value="interview">Interview</option>
                      <option className="bg-surface-container" value="pending">Pending</option>
                      <option className="bg-surface-container" value="rejected">Rejected</option>
                    </select>
                  </div>
                )}
              </div>

              {isDetailLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                </div>
              ) : detailData ? (
                <div className="grid grid-cols-1 grid-flow-row lg:grid-cols-12 gap-gutter items-start">
                  {/* Left Large Column (Drafts, Bullets, Claims) (8 cols) */}
                  <div className="lg:col-span-8 space-y-6">
                    {/* Tailored outreach drafts */}
                    <div className="rounded-card border border-outline-variant bg-surface-container-low/40 backdrop-blur-md p-5 space-y-5 shadow-xl">
                      <div>
                        <h3 className="font-headline text-xs font-bold text-on-surface-variant uppercase tracking-wider">Generated Outreach Material</h3>
                        <p className="text-xs text-on-surface-variant mt-1 font-medium">
                          AI customized copy prepared for candidate cold communications.
                        </p>
                      </div>

                      <div className="space-y-4">
                        {/* Cold Email block */}
                        <div className="rounded-card border border-outline-variant/60 bg-surface-container-lowest/30 overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-2.5 bg-surface-container-low/60 border-b border-outline-variant/60">
                            <span className="text-xs font-headline font-bold text-on-surface flex items-center gap-2">
                              <Mail size={13} className="text-primary" />
                              Cold Email Pitch
                            </span>
                            <button
                              onClick={() => copyToClipboard(
                                `Subject: ${detailData.outreach_draft.cold_email.subject}\n\n${detailData.outreach_draft.cold_email.body}`,
                                'email'
                              )}
                              className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
                            >
                              {copiedText === 'email' ? (
                                <>
                                  <Check size={11} className="text-emerald-400" />
                                  <span className="text-emerald-400 font-bold">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={11} />
                                  <span>Copy Draft</span>
                                </>
                              )}
                            </button>
                          </div>
                          <div className="p-4 space-y-2.5 text-xs text-on-surface">
                            <div>
                              <span className="font-bold text-on-surface-variant mr-2">Subject:</span>
                              <span className="text-on-surface font-medium">{detailData.outreach_draft.cold_email.subject}</span>
                            </div>
                            <pre className="font-mono text-on-surface font-medium whitespace-pre-wrap leading-relaxed border-t border-outline-variant/30 pt-2.5">
                              {detailData.outreach_draft.cold_email.body}
                            </pre>
                          </div>
                        </div>

                        {/* Cover letter block */}
                        {detailData.outreach_draft.cover_letter_paragraphs.length > 0 && (
                          <div className="rounded-card border border-outline-variant/60 bg-surface-container-lowest/30 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2.5 bg-surface-container-low/60 border-b border-outline-variant/60">
                              <span className="text-xs font-headline font-bold text-on-surface flex items-center gap-2">
                                <FileText size={13} className="text-primary" />
                                Cover Letter Paragraphs
                              </span>
                              <button
                                onClick={() => copyToClipboard(
                                  detailData.outreach_draft.cover_letter_paragraphs.join('\n\n'),
                                  'letter'
                                )}
                                className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
                              >
                                {copiedText === 'letter' ? (
                                  <>
                                    <Check size={11} className="text-emerald-400" />
                                    <span className="text-emerald-400 font-bold">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={11} />
                                    <span>Copy Letter</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <div className="p-4 text-xs text-on-surface whitespace-pre-wrap leading-relaxed font-medium space-y-3">
                              {detailData.outreach_draft.cover_letter_paragraphs.map((p, idx) => (
                                <p key={idx}>{p}</p>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Referral pitch block */}
                        {detailData.outreach_draft.referral_message && (
                          <div className="rounded-card border border-outline-variant/60 bg-surface-container-lowest/30 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2.5 bg-surface-container-low/60 border-b border-outline-variant/60">
                              <span className="text-xs font-headline font-bold text-on-surface flex items-center gap-2">
                                <Send size={13} className="text-primary" />
                                LinkedIn / Referral Message
                              </span>
                              <button
                                onClick={() => copyToClipboard(detailData.outreach_draft.referral_message!, 'referral')}
                                className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
                              >
                                {copiedText === 'referral' ? (
                                  <>
                                    <Check size={11} className="text-emerald-400" />
                                    <span className="text-emerald-400 font-bold">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={11} />
                                    <span>Copy Message</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <div className="p-4 text-xs text-on-surface whitespace-pre-wrap font-medium leading-relaxed">
                              {detailData.outreach_draft.referral_message}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tailored bullets compare view */}
                    <div className="rounded-card border border-outline-variant bg-surface-container-low/40 backdrop-blur-md p-5 space-y-4 shadow-xl">
                      <div className="flex items-center justify-between border-b border-outline-variant pb-3">
                        <div>
                          <h3 className="font-headline text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tailored Resume Bullets</h3>
                          <p className="text-xs text-on-surface-variant mt-1 font-medium">
                            Tailoring differences matching the baseline profile ground truth.
                          </p>
                        </div>
                        <button
                          onClick={handlePdfDownload}
                          className="flex items-center gap-2 px-3.5 py-2 rounded-btn bg-primary hover:bg-primary-container text-xs font-bold text-white transition-all shadow-md shadow-primary/20"
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
                            <div key={index} className="space-y-2 p-4 rounded-card bg-surface-container-lowest/30 border border-outline-variant/60">
                              <span className="text-xs font-headline font-bold text-primary">{bullet.project_or_role}</span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                {/* Original */}
                                <div className="p-3.5 rounded bg-rose-950/20 border border-rose-500/20 text-rose-300">
                                  <span className="block font-headline font-bold text-[9px] uppercase tracking-wider text-rose-400 mb-1">Original</span>
                                  <p className="font-medium line-through decoration-rose-500/40">{originalBullet}</p>
                                </div>
                                {/* Tailored */}
                                <div className="p-3.5 rounded bg-emerald-950/20 border border-emerald-500/20 text-emerald-300">
                                  <span className="block font-headline font-bold text-[9px] uppercase tracking-wider text-emerald-400 mb-1">Tailored (Adjudicated)</span>
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

                  {/* Right Small Column (Fit score, Company intel) (4 cols) */}
                  <div className="lg:col-span-4 space-y-6">
                    <FitScoreBar score={detailData.application.fit_score} />
                    <CompanyIntel intel={detailData.company_intel} />
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-on-surface-variant">
                  Application not found.
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: PROFILE JSON CONFIG */}
          {currentView === 'settings' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-outline-variant pb-5">
                <div>
                  <h1 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">Candidate Settings</h1>
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mt-1">
                    JSON Editor & Microservice Statuses
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
                {/* Profile Editor (8 cols) */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="rounded-card border border-outline-variant bg-surface-container-low/40 backdrop-blur-md p-5 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-headline text-sm font-bold text-on-surface uppercase tracking-wider">Candidate Baseline Profile</h3>
                        <p className="text-xs text-on-surface-variant mt-1 font-medium">
                          This represents the candidate ground truth data (profile.json) that feeds into LLM validation.
                        </p>
                      </div>
                      {!isEditing && (
                        <button
                          onClick={startJsonEdit}
                          className="px-4 py-2 rounded-btn bg-primary hover:bg-primary-container text-xs font-bold text-white transition-all shadow-md shadow-primary/20"
                        >
                          Edit Profile
                        </button>
                      )}
                    </div>

                    {/* JSON Editor panel replaced with ProfileForm */}
                    {isEditing ? (
                      profileData && (
                        <ProfileForm
                          initialData={profileData}
                          onSave={handleSaveProfile}
                          onCancel={() => setIsEditing(false)}
                          isSaving={saveProfileMutation.isPending}
                          onFormChange={setJsonText}
                        />
                      )
                    ) : isProfileLoading ? (
                      <div className="h-64 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full border-3 border-primary border-t-transparent animate-spin" />
                      </div>
                    ) : (
                      <pre className="p-4 rounded-lg bg-surface-container-lowest/60 border border-outline-variant overflow-x-auto text-xs text-on-surface leading-relaxed font-mono whitespace-pre max-h-[400px]">
                        {JSON.stringify(profileData, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>

                {/* MCP Status Sidebar list (4 cols) */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="rounded-card border border-outline-variant bg-surface-container-low/40 backdrop-blur-md p-5 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-outline-variant pb-3">
                      <h3 className="font-headline text-sm font-bold text-on-surface uppercase tracking-wider">MCP Server Cluster</h3>
                      <button
                        onClick={() => refetchMcp()}
                        className="p-1.5 rounded bg-surface-container-low border border-outline-variant text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
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
                            className="flex items-center justify-between p-3 rounded-card bg-surface-container-lowest/50 border border-outline-variant/60 text-xs"
                          >
                            <div>
                              <span className="font-headline font-bold text-on-surface block">{name}</span>
                              <span className="text-[10px] text-on-surface-variant mt-0.5 block font-medium">
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
                                  ? 'bg-emerald-400 shadow-md shadow-emerald-400/20' 
                                  : status === 'unhealthy'
                                  ? 'bg-rose-500 shadow-md shadow-rose-500/20'
                                  : 'bg-slate-500'
                              }`} />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-5 text-on-surface-variant text-xs">
                          Checking server statuses...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Collapsible / Persistent Hawk AI Agent drawer on the right in Application Details view */}
      {currentView === 'app' && (
        <aside className="w-80 h-screen bg-gradient-to-b from-[#090d1a] to-surface border-l border-outline-variant flex flex-col z-50 transition-transform duration-300 shrink-0">
          <div className="border-b border-outline-variant flex items-center justify-between px-5 py-4 shrink-0 bg-surface">
            <div className="flex items-center gap-3 text-white">
              <span className="material-symbols-outlined text-amber-400 animate-pulse">smart_toy</span>
              <h3 className="font-headline text-sm font-bold">Hawk AI Agent</h3>
            </div>
            <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded font-mono font-bold animate-pulse">LIVE</span>
          </div>
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-black/20">
            <AgentPanel onApproveSuccess={(id) => handleNavigate('app', id)} />
          </div>
        </aside>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[9999] px-4 py-3 rounded-lg shadow-2xl border flex items-center gap-3 animate-slide-in ${
          toast.type === 'success'
            ? 'bg-surface-container-low border-emerald-500/30 text-emerald-400'
            : 'bg-surface-container-low border-error/30 text-error'
        }`}>
          {toast.type === 'success' ? (
            <Check size={16} className="text-emerald-400" />
          ) : (
            <AlertCircle size={16} className="text-error" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
