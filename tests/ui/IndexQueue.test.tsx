// tests/ui/IndexQueue.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { IndexQueue } from '../../src/ui/IndexQueue';

jest.mock('../../src/api/jobs', () => ({
  fetchJobs: jest.fn().mockResolvedValue({
    pending: [{ id: '1', type: 'add_to_qdrant', title: 'Community Health Worker Models' }],
    processing: null, failed: [], completed_count: 1204, processor_running: true
  }),
  retryJob: jest.fn(),
}));

it('renders pending jobs', async () => {
  render(<IndexQueue />);
  expect(await screen.findByText('Community Health Worker Models')).toBeInTheDocument();
});
