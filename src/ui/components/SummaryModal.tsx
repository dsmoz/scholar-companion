// src/ui/components/SummaryModal.tsx — overlay showing a streamed session summary
import React, { useState, useEffect, useRef } from 'react';
import { X, CopySimple, Check, DownloadSimple } from '@phosphor-icons/react';
import { streamSummarize, exportAsMarkdown } from '../../api/export';
import { renderMarkdown } from '../utils/renderMarkdown';

interface Props {
  sessionId: string;
  onClose: () => void;
}

export function SummaryModal({ sessionId, onClose }: Props) {
  const [text, setText] = useState('');
  const [streaming, setStreaming] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let buffer = '';
    setStreaming(true);
    cancelRef.current = streamSummarize(
      sessionId,
      (token) => { buffer += token; setText(buffer); },
      () => { setStreaming(false); },
      (err) => { setError(err); setStreaming(false); },
    );
    return () => { cancelRef.current?.(); };
  }, [sessionId]);

  function copyText() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function downloadMd() {
    exportAsMarkdown(
      [{ role: 'assistant', text, sources: [] }],
      'Chat Summary',
    );
  }

  return (
    <div className="summary-modal__backdrop" onClick={onClose}>
      <div className="summary-modal" onClick={e => e.stopPropagation()}>
        <div className="summary-modal__header">
          <span className="summary-modal__title">Session Summary</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {text && !streaming && (
              <>
                <button onClick={copyText} className="btn" title={copied ? 'Copied' : 'Copy summary'}>
                  {copied ? <Check size={14} weight="bold" /> : <CopySimple size={14} />}
                </button>
                <button onClick={downloadMd} className="btn" title="Download as Markdown">
                  <DownloadSimple size={14} />
                </button>
              </>
            )}
            <button onClick={onClose} className="btn" title="Close">
              <X size={14} />
            </button>
          </div>
        </div>
        <div className="summary-modal__body">
          {error ? (
            <div style={{ color: 'var(--accent-red)' }}>{error}</div>
          ) : text ? (
            // Content is sanitized by renderMarkdown() via DOMPurify before setting innerHTML
            <SummaryContent html={renderMarkdown(text)} />
          ) : streaming ? (
            <div style={{ color: 'var(--color-text-muted)' }}>Generating summary...</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Renders DOMPurify-sanitized HTML from renderMarkdown(). */
function SummaryContent({ html }: { html: string }) {
  return <div className="chat-markdown" ref={(el) => { if (el) el.innerHTML = html; }} />;
}
