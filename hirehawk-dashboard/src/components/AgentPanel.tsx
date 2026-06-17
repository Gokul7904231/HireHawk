import React, { useState } from 'react';
import { useAgentStream } from '../hooks/useAgentStream';

interface AgentPanelProps {
  onApproveSuccess?: (appId: string) => void;
}

export default function AgentPanel({ onApproveSuccess }: AgentPanelProps) {
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
      startStream(newRunId, jdText);
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
    <div className="flex flex-col h-full justify-between text-white space-y-5">
      {/* Top action block / input JD */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
            Job Description / Prompt Context
          </label>
          <textarea
            id="jd-input"
            value={jdText}
            onChange={e => setJdText(e.target.value)}
            disabled={isStreaming}
            rows={4}
            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-primary-container disabled:opacity-60 disabled:cursor-not-allowed transition-all leading-relaxed resize-none custom-scrollbar"
            placeholder="Paste job description here or type a sourcing prompt..."
          />
        </div>

        <div className="flex gap-3 justify-end">
          {(isComplete || error) && (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm leading-none">refresh</span>
              <span>Reset Panel</span>
            </button>
          )}
          <button
            id="start-agent-btn"
            onClick={handleStart}
            disabled={isStreaming || !jdText.trim()}
            className="w-full py-3 bg-primary-container text-white font-bold rounded-lg hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 group overflow-hidden relative cursor-pointer"
          >
            {isStreaming ? (
              <span className="relative z-10 flex items-center gap-2">
                <span className="material-symbols-outlined text-base animate-spin">autorenew</span>
                <span>Running Agent...</span>
              </span>
            ) : (
              <span className="relative z-10 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">play_arrow</span>
                <span>Trigger Agent Flow</span>
              </span>
            )}
            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
          </button>
        </div>
      </div>

      {/* Stream execution results */}
      <div className="space-y-4 flex-1">
        {/* HITL Awaiting manual approval Banner */}
        {hitlState && (
          <div id="hitl-banner" className="rounded-xl border border-primary-container/40 bg-primary-container/10 overflow-hidden shadow-lg animate-slide-in">
            <div className="flex flex-col p-4 gap-3.5 bg-black/20 border-b border-white/5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary-container/20 text-white shadow flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">help</span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-200">Awaiting your approval</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5 font-medium leading-relaxed">
                    The agent has finished the resume draft, outreach mail, and claims check. Do you approve?
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2.5">
                <button
                  id="reject-btn"
                  onClick={reject}
                  className="px-3 py-1.5 rounded border border-white/10 text-xs font-semibold text-gray-300 hover:text-white hover:bg-error/20 hover:border-error/30 transition-all focus:outline-none cursor-pointer"
                >
                  Reject
                </button>
                <button
                  id="approve-btn"
                  onClick={async () => {
                    const appId = await approve();
                    if (appId) {
                      onApproveSuccess?.(appId);
                    }
                  }}
                  className="px-3.5 py-1.5 rounded bg-primary-container text-xs font-bold text-white shadow-md shadow-primary/20 hover:bg-primary transition-all focus:outline-none cursor-pointer"
                >
                  Approve & Log
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-300 animate-slide-in">
            <span className="material-symbols-outlined text-rose-400">warning</span>
            <div className="text-xs font-semibold">{error}</div>
          </div>
        )}

        {/* Vertical Timeline Steps list */}
        <div className="space-y-3">
          <span className="text-[10px] font-mono tracking-wider text-gray-400 uppercase block">Execution Log</span>
          <div className="relative border-l border-white/10 ml-3 pl-6 space-y-4">
            {steps.map((step, idx) => {
              const duration = formatDuration(step.duration);
              
              let cardStyle = 'border-white/5 bg-white/5 opacity-50';
              let statusLabel = 'Pending';
              let statusColor = 'text-gray-400';
              let dotClass = 'border-gray-600 bg-[#050814]';
              let activeDotContent = null;

              if (step.status === 'running') {
                cardStyle = 'border-primary-container/45 bg-white/10 opacity-100 ring-1 ring-primary-container/20';
                statusLabel = step.name === 'HITL' ? 'Awaiting Approval' : 'Processing';
                statusColor = 'text-primary-container';
                dotClass = 'border-primary-container bg-[#050814] shadow-[0_0_8px_rgba(124,58,237,0.6)] animate-pulse';
                activeDotContent = <div className="w-1.5 h-1.5 rounded-full bg-primary-container" />;
              } else if (step.status === 'done') {
                cardStyle = 'border-emerald-500/20 bg-white/5 opacity-100';
                statusLabel = 'Completed';
                statusColor = 'text-emerald-400';
                dotClass = 'border-emerald-500 bg-[#050814]';
                activeDotContent = <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />;
              } else if (step.status === 'error') {
                cardStyle = 'border-rose-500/20 bg-white/5 opacity-100';
                statusLabel = 'Failed';
                statusColor = 'text-rose-400';
                dotClass = 'border-rose-500 bg-[#050814]';
                activeDotContent = <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />;
              }

              return (
                <div
                  key={idx}
                  className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all duration-300 ${cardStyle}`}
                >
                  {/* Timeline connecting dot */}
                  <div className={`absolute -left-[29px] top-[18px] w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${dotClass}`}>
                    {activeDotContent}
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">{step.mcpServer}</span>
                      <h4 className="text-xs font-bold text-gray-200 mt-0.5">{step.agentName}</h4>
                    </div>
                    {duration && <span className="text-[10px] font-mono font-medium text-gray-400">{duration}</span>}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2">
                    <span className={`text-[9px] font-bold tracking-wider uppercase ${statusColor}`}>{statusLabel}</span>
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
