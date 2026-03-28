// tests/ui/ItemPaneTab.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ItemPaneTab } from '../../src/ui/ItemPaneTab';

jest.mock('../../src/api/chat', () => ({
  streamChat: jest.fn((key, q, onToken, onDone) => {
    onToken('The answer is 42');
    onDone([{ page: 4 }]);
    return () => {};
  }),
}));
jest.mock('../../src/api/search', () => ({
  similarItems: jest.fn().mockResolvedValue([]),
}));
jest.mock('../../src/api/author', () => ({
  fetchAuthorProfile: jest.fn().mockResolvedValue({ author: 'Smith J', items: [], coauthors: [] }),
}));

describe('ItemPaneTab', () => {
  it('renders Chat tab by default', () => {
    render(<ItemPaneTab zoteroKey="ABC123" title="Test Paper" authors={[]} />);
    expect(screen.getByPlaceholderText(/ask about this paper/i)).toBeInTheDocument();
  });

  it('sends question and displays streamed response', async () => {
    const { streamChat } = require('../../src/api/chat');
    render(<ItemPaneTab zoteroKey="ABC123" title="Test Paper" authors={[]} />);
    fireEvent.change(screen.getByPlaceholderText(/ask about this paper/i), {
      target: { value: 'What are the barriers?' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    expect(streamChat).toHaveBeenCalledWith(
      'ABC123', 'What are the barriers?',
      expect.any(Function), expect.any(Function), expect.any(Function), undefined
    );
  });
});
