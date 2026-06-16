import React from 'react';
import { HelpCircle } from 'lucide-react';

interface ApprovalGateProps {
  status: 'idle' | 'awaiting' | 'approved' | 'rejected';
  message: string;
  onApprove?: () => void;
  onReject?: () => void;
}

export default function ApprovalGate({ status, message, onApprove, onReject }: ApprovalGateProps) {
  if (status !== 'awaiting') return null;

  return (
    <div className="rounded-xl border border-purple-500/40 bg-purple-950/20 overflow-hidden shadow-lg shadow-purple-500/5 animate-slide-in">
      <div className="flex flex-col p-4 gap-4 bg-purple-900/10 border-b border-purple-500/20">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 shadow">
            <HelpCircle size={18} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-purple-200">Awaiting your approval</h3>
            <p className="text-[11px] text-purple-400 mt-0.5 font-medium leading-relaxed">
              {message}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2.5">
          <button
            onClick={onReject}
            className="px-3 py-1.5 rounded-lg border border-purple-500/20 text-xs font-semibold text-purple-300 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/30 transition-all focus:outline-none"
          >
            Reject
          </button>
          <button
            onClick={onApprove}
            className="px-3.5 py-1.5 rounded-lg bg-purple-600 text-xs font-bold text-white shadow-md shadow-purple-600/30 hover:bg-purple-500 transition-all focus:outline-none"
          >
            Approve & Log
          </button>
        </div>
      </div>
    </div>
  );
}
