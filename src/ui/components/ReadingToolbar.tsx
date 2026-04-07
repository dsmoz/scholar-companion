// src/ui/components/ReadingToolbar.tsx — compact font size + color + export/summarize controls
import React, { useState } from 'react';
import { TextAa, Minus, Plus, Palette, DownloadSimple, Notepad, FilePdf, FileDoc, FileText } from '@phosphor-icons/react';
import {
  getDiscoveryFontSize, setDiscoveryFontSize,
  getDiscoveryTextColor, setDiscoveryTextColor,
} from '../../prefs';
import { exportSession, exportAsMarkdown } from '../../api/export';
import type { ExportFormat } from '../../api/export';
import type { Message } from './ChatBubble';

const MIN_SIZE = 9;
const MAX_SIZE = 21;
const STEP = 2;

interface ReadingToolbarProps {
  sessionId?: string;
  messages?: Message[];
  onSummarize?: () => void;
  streaming?: boolean;
}

export function ReadingToolbar({ sessionId, messages, onSummarize, streaming }: ReadingToolbarProps) {
  const [size, setSize] = useState(getDiscoveryFontSize());
  const [color, setColor] = useState(getDiscoveryTextColor());
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  function applySize(n: number) {
    const clamped = Math.max(MIN_SIZE, Math.min(MAX_SIZE, n));
    setSize(clamped);
    setDiscoveryFontSize(clamped);
    document.documentElement.style.setProperty('--reading-font-size', `${clamped}px`);
  }

  function applyColor(c: string) {
    setColor(c);
    setDiscoveryTextColor(c);
    document.documentElement.style.setProperty('--reading-text-color', c);
  }

  async function handleExport(format: ExportFormat) {
    setExportOpen(false);
    if (format === 'md' && messages) {
      exportAsMarkdown(messages);
      return;
    }
    if (!sessionId) return;
    setExporting(true);
    try {
      await exportSession(sessionId, format);
    } catch (err) {
      console.error('[AI Companion] Export failed:', err);
    } finally {
      setExporting(false);
    }
  }

  const btnStyle: React.CSSProperties = {
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: '#6c7086', padding: 2, display: 'flex', alignItems: 'center',
  };

  const hasMessages = messages && messages.length > 0;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '2px 10px', borderBottom: '1px solid #313244',
      background: '#181825', flexShrink: 0,
    }}>
      <TextAa size={12} style={{ color: '#6c7086', flexShrink: 0 }} />
      <button onClick={() => applySize(size - STEP)} disabled={size <= MIN_SIZE}
        title="Decrease font size" style={{ ...btnStyle, opacity: size <= MIN_SIZE ? 0.3 : 1 }}>
        <Minus size={10} weight="bold" />
      </button>
      <span style={{ fontSize: '0.6rem', color: '#6c7086', minWidth: 20, textAlign: 'center' }}>{size}</span>
      <button onClick={() => applySize(size + STEP)} disabled={size >= MAX_SIZE}
        title="Increase font size" style={{ ...btnStyle, opacity: size >= MAX_SIZE ? 0.3 : 1 }}>
        <Plus size={10} weight="bold" />
      </button>
      <div style={{ width: 1, height: 12, background: '#313244', margin: '0 2px' }} />
      <label title="Text color" style={{ ...btnStyle, position: 'relative' }}>
        <Palette size={12} style={{ color }} />
        <input
          type="color"
          value={color}
          onChange={e => applyColor(e.target.value)}
          style={{ position: 'absolute', opacity: 0, width: 16, height: 16, cursor: 'pointer' }}
        />
      </label>

      {hasMessages && (
        <>
          <div style={{ width: 1, height: 12, background: '#313244', margin: '0 2px' }} />
          {/* Export dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setExportOpen(o => !o)}
              disabled={exporting || streaming}
              title="Export chat"
              style={{ ...btnStyle, opacity: (exporting || streaming) ? 0.3 : 1 }}
            >
              <DownloadSimple size={12} />
            </button>
            {exportOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: 4,
                background: 'var(--color-surface, #1e1e2e)',
                border: '1px solid var(--color-border-subtle, #45475a)',
                borderRadius: 'var(--radius-md, 4px)',
                boxShadow: 'var(--shadow-md)',
                zIndex: 100, minWidth: 120,
                fontSize: '0.7rem',
              }}>
                <button onClick={() => handleExport('md')} style={{
                  ...btnStyle, padding: '4px 8px', width: '100%', gap: 6,
                  color: 'var(--color-text, #cdd6f4)',
                }}>
                  <FileText size={12} /> Markdown
                </button>
                <button onClick={() => handleExport('docx')} style={{
                  ...btnStyle, padding: '4px 8px', width: '100%', gap: 6,
                  color: 'var(--color-text, #cdd6f4)',
                }}>
                  <FileDoc size={12} /> Word (DOCX)
                </button>
                <button onClick={() => handleExport('pdf')} style={{
                  ...btnStyle, padding: '4px 8px', width: '100%', gap: 6,
                  color: 'var(--color-text, #cdd6f4)',
                }}>
                  <FilePdf size={12} /> PDF
                </button>
              </div>
            )}
          </div>
          {/* Summarize */}
          {onSummarize && (
            <button
              onClick={onSummarize}
              disabled={streaming}
              title="Summarize session"
              style={{ ...btnStyle, opacity: streaming ? 0.3 : 1 }}
            >
              <Notepad size={12} />
            </button>
          )}
        </>
      )}
    </div>
  );
}
