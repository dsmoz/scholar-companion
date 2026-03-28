// tests/ui/Settings.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Settings } from '../../src/ui/Settings';

jest.mock('../../src/api/client', () => ({
  checkConnection: jest.fn().mockResolvedValue({ latency: 34 }),
  ApiError: class ApiError extends Error {},
}));
jest.mock('../../src/api/sync', () => ({
  triggerSync: jest.fn().mockResolvedValue({ queued: 5, already_synced: 1200 }),
}));

describe('Settings', () => {
  it('renders all sections', () => {
    render(<Settings />);
    expect(screen.getByText('APPEARANCE')).toBeInTheDocument();
    expect(screen.getByText('BACKEND CONNECTION')).toBeInTheDocument();
    expect(screen.getByText('SYNC SCHEDULING')).toBeInTheDocument();
    expect(screen.getByText('CHAT')).toBeInTheDocument();
    expect(screen.getByText('DISCOVERY SOURCES')).toBeInTheDocument();
    expect(screen.getByText('DANGER ZONE')).toBeInTheDocument();
  });

  it('Sync now button calls triggerSync', async () => {
    const { triggerSync } = require('../../src/api/sync');
    render(<Settings />);
    fireEvent.click(screen.getByText('Sync now'));
    expect(triggerSync).toHaveBeenCalled();
  });
});
