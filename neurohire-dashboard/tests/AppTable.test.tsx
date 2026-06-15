import React from 'react';
import { describe, test, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppTable from '../src/components/AppTable';

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

describe('AppTable Component Tests', () => {
  test('renders headers, searches, filters, and fires row clicks correctly', async () => {
    const handleSelectApp = vi.fn();
    renderWithClient(<AppTable onSelectApplication={handleSelectApp} />);

    // Wait for applications to render
    await waitFor(() => {
      expect(screen.getByText('Breathe ESG')).toBeInTheDocument();
    });

    // Check that all 5 mock companies are present
    expect(screen.getByText('Breathe ESG')).toBeInTheDocument();
    expect(screen.getByText('Microsoft')).toBeInTheDocument();
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('Stripe')).toBeInTheDocument();
    expect(screen.getByText('Anthropic')).toBeInTheDocument();

    // 1. Search filter test: search "Stripe"
    const searchInput = screen.getByPlaceholderText('Search by company or role...');
    fireEvent.change(searchInput, { target: { value: 'Stripe' } });
    
    // Stripe should remain, but others should disappear
    expect(screen.getByText('Stripe')).toBeInTheDocument();
    expect(screen.queryByText('Microsoft')).not.toBeInTheDocument();

    // Reset search
    fireEvent.change(searchInput, { target: { value: '' } });

    // 2. Status dropdown filter test: select "Interview" status
    const statusSelect = screen.getByRole('combobox');
    fireEvent.change(statusSelect, { target: { value: 'interview' } });

    // Breathe ESG (interview) and Anthropic (interview) should show. Microsoft (applied) should not.
    expect(screen.getByText('Breathe ESG')).toBeInTheDocument();
    expect(screen.getByText('Anthropic')).toBeInTheDocument();
    expect(screen.queryByText('Microsoft')).not.toBeInTheDocument();

    // 3. Row click trigger test
    const breatheRow = screen.getByText('Breathe ESG').closest('tr');
    expect(breatheRow).toBeInTheDocument();
    fireEvent.click(breatheRow!);
    
    expect(handleSelectApp).toHaveBeenCalledWith('6503e116-27c3-4647-b013-72c7736b608b');
  });
});
