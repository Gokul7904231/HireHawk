import { useState, useRef, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AgentStep, StepStatus } from '../types';
import { subscribeToAgentRun, simulateMockApproval } from '../api/stream';
import { triggerApproveRun, logNewMockApplication } from '../api/tracker';

const INITIAL_STEPS: AgentStep[] = [
  { name: 'parse_jd', agentName: 'JD Analyzer', mcpServer: 'jd-parser-mcp', status: 'idle' },
  { name: 'tailor_resume', agentName: 'Resume Tailor', mcpServer: 'resume-mcp', status: 'idle' },
  { name: 'get_company_intel', agentName: 'Company Intel Scraper', mcpServer: 'company-intel-mcp', status: 'idle' },
  { name: 'score_fit', agentName: 'Fit Scorer', mcpServer: 'resume-mcp', status: 'idle' },
  { name: 'write_outreach', agentName: 'Outreach Architect', mcpServer: 'outreach-mcp', status: 'idle' },
  { name: 'HITL', agentName: 'Human-in-the-Loop Review', mcpServer: 'None', status: 'idle' }
];

export function useAgentStream() {
  const queryClient = useQueryClient();
  const [steps, setSteps] = useState<AgentStep[]>(INITIAL_STEPS);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [hitlState, setHitlState] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  
  const activeRunIdRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const timersRef = useRef<Record<string, number>>({});
  const durationsRef = useRef<Record<string, number>>({});
  const jdTextRef = useRef<string>('');

  // Active duration polling effect
  useEffect(() => {
    if (!isStreaming || isComplete) return;

    const interval = setInterval(() => {
      setSteps(prevSteps => 
        prevSteps.map(step => {
          if (step.status === 'running') {
            const startTime = timersRef.current[step.name];
            if (startTime) {
              return {
                ...step,
                duration: Date.now() - startTime
              };
            }
          }
          return step;
        })
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isStreaming, isComplete]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const reset = useCallback(() => {
    setSteps(INITIAL_STEPS.map(s => ({ ...s, status: 'idle', duration: undefined })));
    setIsStreaming(false);
    setIsComplete(false);
    setHitlState(false);
    setError(null);
    setRunId(null);
    activeRunIdRef.current = null;
    timersRef.current = {};
    durationsRef.current = {};
    jdTextRef.current = '';
  }, []);

  const startStream = useCallback((id: string, jdText?: string) => {
    reset();
    setRunId(id);
    activeRunIdRef.current = id;
    setIsStreaming(true);
    if (jdText) {
      jdTextRef.current = jdText;
    }

    // Initial step is running
    const firstStepName = INITIAL_STEPS[0].name;
    timersRef.current[firstStepName] = Date.now();
    setSteps(prev => 
      prev.map((s, idx) => idx === 0 ? { ...s, status: 'running' } : s)
    );

    unsubscribeRef.current = subscribeToAgentRun(
      id,
      (message) => {
        const { event, node, data } = message;

        setSteps(prevSteps => {
          const updated = [...prevSteps];
          
          if (event === 'node_complete' && node) {
            // Find completed step index
            const completedIdx = updated.findIndex(s => s.name === node);
            if (completedIdx !== -1) {
              const start = timersRef.current[node] || Date.now();
              const duration = Date.now() - start;
              durationsRef.current[node] = duration;
              updated[completedIdx] = {
                ...updated[completedIdx],
                status: 'done',
                duration
              };

              // Mark next step as running
              if (completedIdx + 1 < updated.length) {
                const nextStep = updated[completedIdx + 1];
                timersRef.current[nextStep.name] = Date.now();
                updated[completedIdx + 1] = {
                  ...nextStep,
                  status: 'running'
                };
              }
            }
          } else if (event === 'hitl_paused' && node) {
            // Paused on HITL
            const hitlIdx = updated.findIndex(s => s.name === node);
            if (hitlIdx !== -1) {
              const start = timersRef.current[node] || Date.now();
              updated[hitlIdx] = {
                ...updated[hitlIdx],
                status: 'running',
                duration: Date.now() - start
              };
            }
            setHitlState(true);
          } else if (event === 'graph_complete') {
            setIsComplete(true);
            setIsStreaming(false);
          } else if (event === 'graph_error') {
            setError(data?.error || 'Graph execution encountered an error.');
            setIsStreaming(false);
          }

          return updated;
        });
      },
      (err) => {
        setError(err.message || 'Stream subscription connection lost.');
        setIsStreaming(false);
      },
      () => {
        setIsComplete(true);
        setIsStreaming(false);
      }
    );
  }, [reset]);

  const approve = useCallback(async () => {
    if (!runId) return null;

    // Call approve endpoint
    const result = await triggerApproveRun(runId, true);
    if (result.success) {
      setHitlState(false);

      let finalAppId = result.appId || runId;

      // Invalidate queries to refresh applications tracker table and stats
      queryClient.invalidateQueries({ queryKey: ['tracker'] });

      // If mock, trigger the simulation completion
      if (import.meta.env.VITE_MOCK === 'true') {
        simulateMockApproval(runId);
        if (jdTextRef.current) {
          finalAppId = logNewMockApplication(jdTextRef.current);
        }
      }
      
      // Update HITL status to done
      setSteps(prev => 
        prev.map(s => {
          if (s.name === 'HITL') {
            const start = timersRef.current['HITL'] || Date.now();
            return {
              ...s,
              status: 'done',
              duration: Date.now() - start
            };
          }
          return s;
        })
      );

      return finalAppId;
    } else {
      setError("Failed to submit manual approval.");
      return null;
    }
  }, [runId, queryClient]);

  const reject = useCallback(async () => {
    if (!runId) return;
    
    // Call reject/approve false
    await triggerApproveRun(runId, false);
    setHitlState(false);
    setIsStreaming(false);
    
    setSteps(prev => 
      prev.map(s => {
        if (s.name === 'HITL') {
          return {
            ...s,
            status: 'error',
            error: 'Rejected by candidate.'
          };
        }
        return s;
      })
    );
  }, [runId]);

  return {
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
  };
}
