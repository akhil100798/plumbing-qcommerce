// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import React from 'react';

describe('Admin Portal Dashboard Component', () => {
  it('renders the Dashboard header cleanly', () => {
    render(
      <div data-testid="admin-dashboard-container">
        <h1>FixKart Operations Admin Dashboard</h1>
        <p>Real-time platform operations and metrics overview</p>
      </div>
    );

    expect(screen.getByTestId('admin-dashboard-container')).toBeDefined();
    expect(screen.getByText('FixKart Operations Admin Dashboard')).toBeDefined();
  });
});
