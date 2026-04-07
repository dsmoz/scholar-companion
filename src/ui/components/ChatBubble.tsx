// src/ui/components/ChatBubble.tsx — shared message bubble for all chat panels
import React, { useState } from 'react';
import { CopySimple, Check, MagnifyingGlass } from '@phosphor-icons/react';
import type { Source } from '../../api/chat';
import { TypingDots } from './TypingDots';
import { renderMarkdown, formatApaSourceText, collapseSources } from '../utils/renderMarkdown';

export interface Message { role: 'user' | 'assistant'; text: string; sources?: Source[] }

interface ChatBubbleProps {
  message: Message;
  isLastMessage: boolean;
  streaming: boolean;
}

export function ChatBubble({ message, isLastMessage, streaming }: ChatBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === 'assistant';

  function copyText() {
    // Build plain text with sources
    let plainText = message.text;
    if (message.sources?.length) {
      const { primary, expanded } = collapseSources(message.sources);
      const allCollapsed = [...primary, ...expanded];
      if (allCollapsed.length) {
        plainText += '\n\nSources:\n';
        plainText += allCollapsed.map(c => `[${c.label}] ${formatApaSourceText(c.source)}`).join('\n');
      }
    }

    // Build HTML with superscript citations preserved for Word paste
    let htmlText = renderMarkdown(message.text, message.sources);
    if (message.sources?.length) {
      const { primary, expanded } = collapseSources(message.sources);
      if (primary.length || expanded.length) {
        htmlText += '<hr style="margin:8px 0;border:none;border-top:1px solid #ccc"><p><strong>Sources</strong></p><ul>';
        for (const c of [...primary, ...expanded]) {
          htmlText += `<li>[${c.label}] ${formatApaSourceText(c.source)}</li>`;
        }
        htmlText += '</ul>';
      }
    }

    // Use ClipboardItem for rich text (superscripts in Word), fallback to plain text
    if (typeof ClipboardItem !== 'undefined') {
      navigator.clipboard.write([new ClipboardItem({
        'text/plain': new Blob([plainText], { type: 'text/plain' }),
        'text/html': new Blob([htmlText], { type: 'text/html' }),
      })]).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    } else {
      navigator.clipboard.writeText(plainText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    }
  }

  return (
    <div className="chat-bubble" style={{
      alignSelf: isAssistant ? 'flex-start' : 'flex-end',
      background: isAssistant ? '#1e1e2e' : '#313244',
      border: isAssistant ? '1px solid #444' : 'none',
      borderRadius: 6, padding: '6px 10px', maxWidth: '90%', color: '#cdd6f4',
    }}>
      {isAssistant ? (
        streaming && isLastMessage && !message.text
          ? <TypingDots />
          : <AssistantMessage html={renderMarkdown(message.text, message.sources)} />
      ) : (
        <span>{message.text}</span>
      )}
      {message.sources && message.sources.length > 0 && (
        <SourcesSection sources={message.sources} />
      )}
      {isAssistant && message.text && (
        <button
          className="chat-bubble__copy"
          onClick={copyText}
          title={copied ? 'Copied' : 'Copy message'}
        >
          {copied ? <Check size={12} weight="bold" /> : <CopySimple size={12} />}
        </button>
      )}
    </div>
  );
}

// HTML is pre-sanitized by renderMarkdown() which uses DOMPurify
function AssistantMessage({ html }: { html: string }) {
  return <div className="chat-markdown" ref={(el) => { if (el) el.innerHTML = html; }} />;
}

function SourcesSection({ sources }: { sources: Source[] }) {
  const { primary, expanded } = collapseSources(sources);
  return (
    <div className="sources-section">
      {primary.length > 0 && (
        <>
          <div className="sources-section-label">Sources</div>
          {primary.map((c, si) => (
            <div key={si} className="source-entry">
              <span className="source-entry__num">[{c.label}]</span>
              {formatApaSourceText(c.source)}
            </div>
          ))}
        </>
      )}
      {expanded.length > 0 && (
        <>
          <div className="sources-section-label" style={{ marginTop: primary.length > 0 ? 6 : 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            <MagnifyingGlass size={10} /> From your library
          </div>
          {expanded.map((c, si) => (
            <div key={`exp-${si}`} className="source-entry" style={{ opacity: 0.85 }}>
              <span className="source-entry__num">[{c.label}]</span>
              {formatApaSourceText(c.source)}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
