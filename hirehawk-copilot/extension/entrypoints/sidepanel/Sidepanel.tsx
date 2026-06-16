import React, { useState, useEffect } from 'react';
import StreamCard from './components/StreamCard';
import ApprovalGate from './components/ApprovalGate';
import { Play, RotateCcw, CheckCircle } from 'lucide-react';

interface Step {
  phase: string;
  type: string;
  title: string;
  duration: string;
  status: 'completed' | 'active' | 'pending' | 'error';
}

export default function Sidepanel() {
  const [detectedJob, setDetectedJob] = useState({
    company: "Microsoft",
    role: "Software Engineer - Copilot Team"
  });

  const [isRunning, setIsRunning] = useState(false);
  const [flowState, setFlowState] = useState<'idle' | 'running' | 'hitl' | 'approved' | 'rejected'>('idle');
  
  const [steps, setSteps] = useState<Step[]>([
    { phase: "Phase 1", type: "JD-PARSER-MCP", title: "JD Analyzer", duration: "1.0s", status: "pending" },
    { phase: "Phase 2", type: "RESUME-MCP", title: "Resume Tailor", duration: "1.2s", status: "pending" },
    { phase: "Phase 3", type: "COMPANY-INTEL-MCP", title: "Company Intel Scraper", duration: "1.3s", status: "pending" },
    { phase: "Phase 4", type: "RESUME-MCP", title: "Fit Scorer", duration: "1.3s", status: "pending" },
    { phase: "Phase 5", type: "OUTREACH-MCP", title: "Outreach Architect", duration: "1.4s", status: "pending" },
    { phase: "Phase 6", type: "NONE", title: "Human-in-the-Loop Review", duration: "9.7s", status: "pending" }
  ]);

  const triggerFlow = () => {
    if (isRunning) return;
    setIsRunning(true);
    setFlowState('running');
    
    // Reset steps
    setSteps(prev => prev.map(s => ({ ...s, status: 'pending' })));

    let currentStep = 0;
    
    const runNextStep = () => {
      if (currentStep >= steps.length) {
        setIsRunning(false);
        return;
      }

      // Mark current step as active
      setSteps(prev => {
        const nextSteps = [...prev];
        nextSteps[currentStep] = { ...nextSteps[currentStep], status: 'active' };
        return nextSteps;
      });

      // Calculate step delay based on duration
      const durationSecs = parseFloat(steps[currentStep].duration) || 1.0;
      const delay = durationSecs * 1000;

      setTimeout(() => {
        // Complete current step
        setSteps(prev => {
          const nextSteps = [...prev];
          nextSteps[currentStep] = { ...nextSteps[currentStep], status: 'completed' };
          return nextSteps;
        });

        currentStep++;
        
        if (currentStep === 5) {
          // Phase 6 is HITL. Make it active and show the gate
          setSteps(prev => {
            const nextSteps = [...prev];
            nextSteps[5] = { ...nextSteps[5], status: 'active' };
            return nextSteps;
          });
          setFlowState('hitl');
          setIsRunning(false);
        } else {
          runNextStep();
        }
      }, delay);
    };

    runNextStep();
  };

  const handleApprove = () => {
    setSteps(prev => {
      const nextSteps = [...prev];
      nextSteps[5] = { ...nextSteps[5], status: 'completed' };
      return nextSteps;
    });
    setFlowState('approved');
  };

  const handleReject = () => {
    setSteps(prev => {
      const nextSteps = [...prev];
      nextSteps[5] = { ...nextSteps[5], status: 'error' };
      return nextSteps;
    });
    setFlowState('rejected');
  };

  const handleReset = () => {
    setFlowState('idle');
    setIsRunning(false);
    setSteps(prev => prev.map(s => ({ ...s, status: 'pending' })));
  };

  return (
    <div className="w-[380px] h-screen bg-[#09090b] text-white border-l border-[#1f1f23] flex flex-col font-sans overflow-hidden">
      {/* Top Identity Header */}
      <div className="p-4 border-b border-[#1f1f23] bg-[#121214] flex justify-between items-center">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-purple-400">HIREHAWK</h2>
          <p className="text-[10px] text-gray-400 uppercase font-semibold">Agentic Co-Pilot Window</p>
        </div>
        <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full font-mono">
          Context Linked
        </span>
      </div>

      {/* Active Webpage Target Info Box */}
      <div className="p-4 bg-[#161619] border-b border-[#1f1f23] flex justify-between items-center">
        <div className="space-y-1">
          <span className="text-[10px] font-mono tracking-wider text-gray-500 uppercase">Target Detected</span>
          <h3 className="text-sm font-bold text-gray-100">{detectedJob.role}</h3>
          <p className="text-xs text-purple-300">{detectedJob.company}</p>
        </div>
        
        {flowState === 'idle' && (
          <button
            onClick={triggerFlow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-all shadow"
          >
            <Play size={12} />
            <span>Run</span>
          </button>
        )}

        {(flowState === 'approved' || flowState === 'rejected') && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1f1f23] bg-[#121214] hover:bg-[#1f1f23] text-xs font-semibold text-gray-300 transition-all"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Vertical Interactive Agent Engine Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pr-2">
        {/* Approved Banner */}
        {flowState === 'approved' && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 animate-slide-in">
            <CheckCircle size={18} />
            <div className="text-xs font-semibold">Application approved and logged successfully!</div>
          </div>
        )}

        {/* Human-In-The-Loop Interactive Gate */}
        <ApprovalGate 
          status={flowState === 'hitl' ? 'awaiting' : 'idle'} 
          message="The agent has finished the resume draft, outreach mail, and claims check. Do you approve?"
          onApprove={handleApprove}
          onReject={handleReject}
        />

        {/* Re-mapped vertical timeline */}
        <div className="space-y-3">
          <span className="text-[10px] font-mono tracking-wider text-gray-500 uppercase block">Execution Nodes</span>
          <div className="relative border-l-2 border-[#1f1f23] ml-3 pl-6 space-y-4">
            {steps.map((s, idx) => (
              <StreamCard
                key={idx}
                phase={s.phase}
                type={s.type}
                title={s.title}
                duration={s.duration}
                status={s.status}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
