const MOCK_MODE = import.meta.env.VITE_MOCK === 'true';
const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000';

export function subscribeToAgentRun(
  runId: string,
  onMessage: (event: { event: string; node?: string; data: any }) => void,
  onError: (err: any) => void,
  onClose: () => void
): () => void {
  if (MOCK_MODE) {
    let timeoutId: any = null;
    let isCancelled = false;

    const IS_TEST = import.meta.env.MODE === 'test';
    const base = IS_TEST ? 10 : 1000;

    // Define simulation steps
    const steps = [
      { event: 'node_complete', node: 'parse_jd', delay: base, data: { msg: "Parsed job requirements successfully." } },
      { event: 'node_complete', node: 'tailor_resume', delay: base * 2.2, data: { msg: "Tailored 2 resume bullets to match JD skills." } },
      { event: 'node_complete', node: 'get_company_intel', delay: base * 3.5, data: { msg: "Gathered Breathe ESG Series A funding details." } },
      { event: 'node_complete', node: 'score_fit', delay: base * 4.8, data: { msg: "Evaluated profile. Calculated Fit Score: 85/100." } },
      { event: 'node_complete', node: 'write_outreach', delay: base * 6.2, data: { msg: "Drafted cold email and cover letter paragraphs." } },
      { event: 'hitl_paused', node: 'HITL', delay: base * 7.5, data: { msg: "Awaiting candidate manual verification." } },
    ];

    const runSimulationStep = (index: number) => {
      if (isCancelled) return;
      if (index >= steps.length) return;

      const step = steps[index];
      timeoutId = setTimeout(() => {
        onMessage({
          event: step.event,
          node: step.node,
          data: step.data
        });
        
        // If it's not the paused breakpoint, queue next
        if (step.event !== 'hitl_paused') {
          runSimulationStep(index + 1);
        }
      }, step.delay - (index > 0 ? steps[index - 1].delay : 0));
    };

    // Begin simulation
    runSimulationStep(0);

    // Provide custom event listener for approval callback
    const handleApproval = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.runId === runId) {
        // Resume simulation from HITL
        onMessage({
          event: 'node_complete',
          node: 'HITL',
          data: { msg: "Approved by candidate." }
        });

        // Add final tracking step
        timeoutId = setTimeout(() => {
          onMessage({
            event: 'node_complete',
            node: 'tracker',
            data: { msg: "Application logged into Supabase application tracker." }
          });

          timeoutId = setTimeout(() => {
            onMessage({
              event: 'graph_complete',
              data: { msg: "Agent run completed successfully." }
            });
            onClose();
          }, IS_TEST ? 10 : 1000);
        }, IS_TEST ? 10 : 1200);
      }
    };

    window.addEventListener('mock-approve-run', handleApproval);

    return () => {
      isCancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('mock-approve-run', handleApproval);
    };
  }

  // Real EventSource stream
  const eventSource = new EventSource(`${FASTAPI_URL}/stream/${runId}`);

  eventSource.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      onMessage(parsed);
    } catch (err) {
      onError(err);
    }
  };

  eventSource.onerror = (err) => {
    onError(err);
    eventSource.close();
  };

  // Listen for custom close events
  eventSource.addEventListener('close', () => {
    onClose();
    eventSource.close();
  });

  return () => {
    eventSource.close();
  };
}

// Function to dispatch mock approval event to trigger resume
export function simulateMockApproval(runId: string) {
  const event = new CustomEvent('mock-approve-run', { detail: { runId } });
  window.dispatchEvent(event);
}
