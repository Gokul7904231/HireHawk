import React from 'react';
import { describe, test, expect, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AgentPanel from '../src/components/AgentPanel';

beforeAll(() => {
  import.meta.env.VITE_MOCK = 'true';
});

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('AgentPanel Component Tests', () => {
  test('streams agent execution phases and shows approval banner', async () => {
    renderWithClient(<AgentPanel />);

    // 1. Initial State: check that the trigger button is visible
    const triggerBtn = screen.getByText('Trigger Agent Flow');
    expect(triggerBtn).toBeInTheDocument();

    // 2. Click button to trigger agent flow
    fireEvent.click(triggerBtn);

    // Wait for the button state to change to running (processing)
    await waitFor(() => {
      expect(screen.getByText('Running Agent...')).toBeInTheDocument();
    });

    // 3. Wait for the mock steps to finish and the HITL manual approval banner to render
    // Since we are in test mode, delays are scaled to 10ms base delay, completing in ~75ms.
    await waitFor(() => {
      expect(screen.getByText('Awaiting your approval')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Check that agent card phases are visible
    expect(screen.getByText('JD Analyzer')).toBeInTheDocument();
    expect(screen.getByText('Outreach Architect')).toBeInTheDocument();
    expect(screen.getByText('Human-in-the-Loop Review')).toBeInTheDocument();

    // 4. Click the Approve button
    const approveBtn = screen.getByText('Approve & Log');
    fireEvent.click(approveBtn);

    // The approval action will trigger the final resume steps, completing in ~20ms.
    // Wait for the pipeline completion and the "Reset Panel" button to appear.
    await waitFor(() => {
      expect(screen.getByText('Reset Panel')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
