import React from 'react';
import { describe, test, expect, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MetricCards from '../src/components/MetricCards';

// Enable mock mode globally for tests
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

describe('MetricCards Component Tests', () => {
  test('renders correct values from mock fixture stats data', async () => {
    renderWithClient(<MetricCards />);

    // Wait for the query client to resolve mock fixtures
    await waitFor(() => {
      expect(screen.getByText('Total Applications')).toBeInTheDocument();
    });

    // Verify correct totals are rendered
    expect(screen.getByText('5')).toBeInTheDocument(); // total applications
    expect(screen.getByText('2')).toBeInTheDocument(); // interviews count (interview status)
    expect(screen.getByText('83.6%')).toBeInTheDocument(); // average fit score (computed)
  });
});
