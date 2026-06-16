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
    startStream,
    approve,
    reject,
    reset
  } = useAgentStream();

  const handleStart = async () => {
    if (!jdText.trim()) return;

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
      <div className="rounded-xl border border-[#1f1f23] bg-[#121214] p-5 space-y-4 shadow-lg">
        <div>
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Execute Recruiter Agent</h2>
          <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-relaxed uppercase">
            RAW JOB DESCRIPTION CONTEXT
          </p>
        </div>

        <textarea
          id="jd-input"
          value={jdText}
          onChange={e => setJdText(e.target.value)}
          disabled={isStreaming}
          rows={3}
          className="w-full p-3.5 rounded-lg bg-[#09090b] border border-[#1f1f23] text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all leading-relaxed"
          placeholder="Paste job description here..."
        />

        <div className="flex gap-3 justify-end">
          {(isComplete || error) && (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#1f1f23] bg-[#09090b] text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#121214] transition-all"
            >
              <RefreshCw size={13} />
              <span>Reset Panel</span>
            </button>
          )}
          <button
            id="start-agent-btn"
            onClick={handleStart}
            disabled={isStreaming || !jdText.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 text-xs font-bold text-white shadow-md shadow-purple-600/30 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isStreaming ? (
              <>
                <Loader2 className="animate-spin" size={13} />
                <span>Running Agent...</span>
              </>
            ) : (
              <>
                <Play size={13} />
                <span>Trigger Agent Flow</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stream execution results */}
      <div className="space-y-4">
        {/* HITL Awaiting manual approval Banner */}
        {hitlState && (
          <div id="hitl-banner" className="rounded-xl border border-purple-500/40 bg-purple-950/20 overflow-hidden shadow-lg shadow-purple-500/5 animate-slide-in">
            <div className="flex flex-col p-4 gap-4 bg-purple-900/10 border-b border-purple-500/20">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 shadow">
                  <HelpCircle size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-purple-200">Awaiting your approval</h3>
                  <p className="text-[11px] text-purple-400 mt-0.5 font-medium leading-relaxed">
                    The agent has finished the resume draft, outreach mail, and claims check. Do you approve?
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2.5">
                <button
                  id="reject-btn"
                  onClick={reject}
                  className="px-3 py-1.5 rounded-lg border border-purple-500/20 text-xs font-semibold text-purple-300 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/30 transition-all focus:outline-none"
                >
                  Reject
                </button>
                <button
                  id="approve-btn"
                  onClick={approve}
                  className="px-3.5 py-1.5 rounded-lg bg-purple-600 text-xs font-bold text-white shadow-md shadow-purple-600/30 hover:bg-purple-500 transition-all focus:outline-none"
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

        {/* Vertical Timeline Steps list */}
        <div className="space-y-3">
          <span className="text-[10px] font-mono tracking-wider text-gray-500 uppercase block">Execution Nodes</span>
          <div className="relative border-l-2 border-[#1f1f23] ml-3 pl-6 space-y-4">
            {steps.map((step, idx) => {
              const duration = formatDuration(step.duration);
              
              let cardStyle = 'border-[#1f1f23] bg-[#09090b] opacity-60';
              let statusLabel = 'Pending';
              let statusIndicator = <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />;
              let dotIndicator = (
                <div className="absolute -left-[29px] top-[18px] w-2.5 h-2.5 rounded-full bg-[#09090b] border-2 border-slate-700" />
              );

              if (step.status === 'running') {
                cardStyle = 'border-purple-500/40 bg-[#121214] shadow-md shadow-purple-500/5 opacity-100 ring-1 ring-purple-500/20';
                statusLabel = step.name === 'HITL' ? 'Awaiting Approval' : 'Processing';
                statusIndicator = <Loader2 className="animate-spin text-purple-400" size={13} />;
                dotIndicator = (
                  <div className="absolute -left-[32px] top-[15px] w-4 h-4 rounded-full bg-[#121214] border-2 border-purple-500 shadow-[0_0_8px_rgba(139,92,246,0.6)] flex items-center justify-center animate-pulse">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  </div>
                );
              } else if (step.status === 'done') {
                cardStyle = 'border-emerald-500/30 bg-[#121214]/60 opacity-100';
                statusLabel = 'Completed';
                statusIndicator = <CheckCircle2 className="text-emerald-400" size={13} />;
                dotIndicator = (
                  <div className="absolute -left-[32px] top-[15px] w-4 h-4 rounded-full bg-[#121214] border-2 border-emerald-500 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                );
              } else if (step.status === 'error') {
                cardStyle = 'border-rose-500/30 bg-[#121214] opacity-100';
                statusLabel = 'Failed';
                statusIndicator = <AlertTriangle className="text-rose-400" size={13} />;
                dotIndicator = (
                  <div className="absolute -left-[32px] top-[15px] w-4 h-4 rounded-full bg-[#121214] border-2 border-rose-500 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all duration-300 ${cardStyle}`}
                >
                  {/* Timeline connecting dot */}
                  {dotIndicator}

                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider">{step.mcpServer}</span>
                      <h4 className="text-xs font-bold text-gray-200 mt-0.5">{step.agentName}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      {duration && <span className="text-[10px] font-mono font-medium text-gray-400">{duration}</span>}
                      {statusIndicator}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-[#1f1f23] pt-2">
                    <span className="text-[9px] text-gray-400 font-semibold tracking-wider uppercase">{statusLabel}</span>
                    <span className="text-[9px] text-gray-500 font-mono">Phase {idx + 1}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
