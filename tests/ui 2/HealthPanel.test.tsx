// tests/ui/HealthPanel.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { HealthPanel } from '../../src/ui/HealthPanel';

jest.mock('../../src/api/health', () => ({
  fetchLibraryHealth: jest.fn().mockResolvedValue({
    indexed: 1204, unindexed: 43, failed: 12, missing_pdf: 27, issues: [
      { zotero_key: 'ABC', title: 'Test Paper', issue_type: 'failed_sync', error_message: 'embedding error' }
    ]
  }),
}));

it('renders health summary cards', async () => {
  render(<HealthPanel />);
  expect(await screen.findByText('1204')).toBeInTheDocument();
  expect(await screen.findByText('43')).toBeInTheDocument();
});
