import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginSignup from '../src/components/LoginSignup';

describe('LoginSignup Component Tests', () => {
  test('renders login form by default and can toggle to signup form', () => {
    const handleLoginSuccess = vi.fn();
    render(<LoginSignup onLoginSuccess={handleLoginSuccess} />);

    // Default: Login mode
    expect(screen.getByText('NeuroHire Workspace')).toBeInTheDocument();
    expect(screen.getByText('Log in to orchestrate your autonomous recruitment pipeline')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('gokul@neurohire.ai')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Gokul')).not.toBeInTheDocument(); // Name field is hidden in login mode

    // Toggle to Sign up mode
    const toggleButton = screen.getByRole('button', { name: /Don't have an account\?/i });
    fireEvent.click(toggleButton);

    // Now in Signup mode
    expect(screen.getByText('Create an account to scale your recruitment capacity')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Gokul')).toBeInTheDocument(); // Name field is visible in signup mode
    expect(screen.getByText('Organization Role')).toBeInTheDocument();

    // Toggle back to Log in mode
    const toggleBack = screen.getByRole('button', { name: /Already have an account\?/i });
    fireEvent.click(toggleBack);
    expect(screen.queryByPlaceholderText('Gokul')).not.toBeInTheDocument();
  });

  test('validates incorrect fields on submit', () => {
    const handleLoginSuccess = vi.fn();
    render(<LoginSignup onLoginSuccess={handleLoginSuccess} />);

    // Try submit empty
    const submitBtn = screen.getByRole('button', { name: /Login Workspace/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Email and password are required.')).toBeInTheDocument();
  });

  test('handles successful login and triggers callback', async () => {
    const handleLoginSuccess = vi.fn();
    render(<LoginSignup onLoginSuccess={handleLoginSuccess} />);

    const emailInput = screen.getByPlaceholderText('gokul@neurohire.ai');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /Login Workspace/i });

    // Fill in valid credentials
    fireEvent.change(emailInput, { target: { value: 'candidate@neurohire.ai' } });
    fireEvent.change(passwordInput, { target: { value: 'correctpassword' } });
    fireEvent.click(submitBtn);

    // Should transition to loading/authenticating state
    expect(screen.getByText('Authenticating...')).toBeInTheDocument();

    // Wait for the simulated network delay and callback execution
    await waitFor(() => {
      expect(screen.getByText('Verification Approved')).toBeInTheDocument();
    }, { timeout: 2000 });

    await waitFor(() => {
      expect(handleLoginSuccess).toHaveBeenCalledWith('candidate@neurohire.ai');
    }, { timeout: 2000 });
  });
});
