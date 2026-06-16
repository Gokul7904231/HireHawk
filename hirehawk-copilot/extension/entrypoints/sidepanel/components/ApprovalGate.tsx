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
    <div className="rounded-xl border border-primary-container/40 bg-primary-container/10 overflow-hidden shadow-lg animate-slide-in">
      <div className="flex flex-col p-4 gap-4 bg-black/20 border-b border-white/5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary-container/20 text-on-primary-container shadow">
            <HelpCircle size={18} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-200">Awaiting your approval</h3>
            <p className="text-[11px] text-gray-400 mt-0.5 font-medium leading-relaxed">
              {message}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2.5">
          <button
            onClick={onReject}
            className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-semibold text-gray-300 hover:text-white hover:bg-error/20 hover:border-error/30 transition-all focus:outline-none"
          >
            Reject
          </button>
          <button
            onClick={onApprove}
            className="px-3.5 py-1.5 rounded-lg bg-primary-container text-xs font-bold text-white shadow-md shadow-primary/20 hover:bg-primary transition-all focus:outline-none"
          >
            Approve & Log
          </button>
        </div>
      </div>
    </div>
  );
}
