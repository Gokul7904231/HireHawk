import React, { useState } from 'react';
import { Play, CheckCircle2, Loader2, AlertTriangle, HelpCircle, RefreshCw } from 'lucide-react';
import { useAgentStream } from '../hooks/useAgentStream';

export default function AgentPanel() {
  const [jdText, setJdText] = useState(
    "We are looking for an AI Engineer Intern at Breathe ESG to help build carbon ingestion pipelines and LLM-powered ESG reporting agents. Tech stack includes Python, Django, React, and LangChain."
  );
  
  const {
    steps,
    isStreaming,
    isComplete,
    hitlState,
    error,
    runId,
    startStream,
    approve,
    reject,
    reset
  } = useAgentStream();

  const handleStart = async () => {
    if (!jdText.trim()) return;

    // In mock mode or real mode, generate a runId
    const newRunId = import.meta.env.VITE_MOCK === 'true' 
      ? `mock-run-${Math.random().toString(36).substring(2, 15)}` 
      : await startRealRun();

    if (newRunId) {
      startStream(newRunId);
    }
  };

  const startRealRun = async (): Promise<string | null> => {
    try {
      const res = await fetch(`${import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000'}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jd_raw: jdText,
          user_id: "dashboard_user"
        })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      return data.run_id;
    } catch {
      // Fallback to mock run if server is offline
      return `fallback-run-${Math.random().toString(36).substring(2, 15)}`;
    }
  };

  const formatDuration = (ms?: number) => {
    if (ms === undefined) return '';
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-6">
      {/* Top action block / input JD */}
      <div className="rounded-xl border border-[#1e293b] bg-[#0d1321]/60 p-5 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Execute Agent Recruiter</h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Paste a raw job description below to stream live multi-agent resume tailoring and outreach draft writing.
          </p>
        </div>

        <textarea
          id="jd-input"
          value={jdText}
          onChange={e => setJdText(e.target.value)}
          disabled={isStreaming}
          rows={3}
          className="w-full p-3.5 rounded-lg bg-[#070b13] border border-[#1e293b] text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          placeholder="Paste job description here..."
        />

        <div className="flex gap-3 justify-end">
          {(isComplete || error) && (
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1e293b] bg-[#0b0f19] text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-500 hover:bg-[#161f30] transition-all"
            >
              <RefreshCw size={14} />
              <span>Reset Panel</span>
            </button>
          )}
          <button
            id="start-agent-btn"
            onClick={handleStart}
            disabled={isStreaming || !jdText.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-xs font-bold text-white shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all"
          >
            {isStreaming ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                <span>Running Agent...</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>Trigger Agent Flow</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stream execution results */}
      {(isStreaming || isComplete || error || steps.some(s => s.status !== 'idle')) && (
        <div className="space-y-5">
          {/* HITL Awaiting manual approval Banner */}
          {hitlState && (
            <div id="hitl-banner" className="rounded-xl border border-purple-500/40 bg-purple-950/20 overflow-hidden shadow-lg shadow-purple-500/5 animate-slide-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4 bg-purple-900/10 border-b border-purple-500/20">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 shadow">
                    <HelpCircle size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-purple-200">Awaiting your approval</h3>
                    <p className="text-xs text-purple-400 mt-0.5 font-medium">
                      The agent has finished the resume draft, outreach mail, and claims check. Do you approve?
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    id="reject-btn"
                    onClick={reject}
                    className="px-4 py-2 rounded-lg border border-purple-500/20 text-xs font-semibold text-purple-300 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/30 transition-all"
                  >
                    Reject
                  </button>
                  <button
                    id="approve-btn"
                    onClick={approve}
                    className="px-4 py-2 rounded-lg bg-purple-600 text-xs font-bold text-white shadow-md shadow-purple-600/30 hover:bg-purple-500 transition-all"
                  >
                    Approve & Log
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 animate-slide-in">
              <AlertTriangle className="text-rose-500 shrink-0" size={18} />
              <div className="text-xs font-semibold text-rose-400">{error}</div>
            </div>
          )}

          {/* Steps list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {steps.map((step, idx) => {
              const duration = formatDuration(step.duration);
              
              // Border and styling based on status
              let cardStyle = 'border-[#1e293b] bg-[#0d1321]/30 opacity-50';
              let iconColor = 'text-slate-500';
              let statusLabel = 'Pending';
              let statusIndicator = <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />;

              if (step.status === 'running') {
                cardStyle = 'border-purple-500/40 bg-[#0d1321]/90 shadow-md shadow-purple-500/5 opacity-100 glow-purple';
                iconColor = 'text-purple-400';
                statusLabel = step.name === 'HITL' ? 'Awaiting Approval' : 'Processing';
                statusIndicator = <Loader2 className="animate-spin text-purple-400" size={14} />;
              } else if (step.status === 'done') {
                cardStyle = 'border-emerald-500/30 bg-[#0d1321]/60 opacity-100 glow-green';
                iconColor = 'text-emerald-400';
                statusLabel = 'Completed';
                statusIndicator = <CheckCircle2 className="text-emerald-400" size={14} />;
              } else if (step.status === 'error') {
                cardStyle = 'border-rose-500/30 bg-[#0d1321]/60 opacity-100';
                iconColor = 'text-rose-400';
                statusLabel = 'Failed';
                statusIndicator = <AlertTriangle className="text-rose-400" size={14} />;
              }

              return (
                <div
                  key={idx}
                  className={`flex flex-col justify-between p-4 rounded-xl border transition-all duration-300 ${cardStyle}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{step.mcpServer}</span>
                      <h4 className="text-sm font-bold text-slate-100 mt-1">{step.agentName}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-medium text-slate-400">{duration}</span>
                      {statusIndicator}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-[#1e293b]/50 pt-2.5">
                    <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">{statusLabel}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Phase {idx + 1}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
