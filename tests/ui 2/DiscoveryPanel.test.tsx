// tests/ui/DiscoveryPanel.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiscoveryPanel } from '../../src/ui/DiscoveryPanel';

jest.mock('../../src/api/discovery', () => ({
  discoverySearch: jest.fn().mockResolvedValue([
    { title: 'PrEP in MSM', authors: ['Smith J'], journal: 'Lancet', year: '2023', doi: '', source: 'pubmed' }
  ]),
}));

it('displays discovery results after search', async () => {
  render(<DiscoveryPanel seedQuery="PrEP MSM" />);
  fireEvent.click(screen.getByText('Search'));
  expect(await screen.findByText('PrEP in MSM')).toBeInTheDocument();
});
