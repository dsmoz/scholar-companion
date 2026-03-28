// src/ui/IndexQueue.tsx
import React, { useState, useEffect } from 'react';
import { Play, Pause } from '@phosphor-icons/react';
import { SectionHeader } from './components/SectionHeader';
import { StatusDot } from './components/StatusDot';
import { fetchJobs, retryJob, JobsStatus } from '../api/jobs';

export function IndexQueue() {
  const [status, setStatus] = useState<JobsStatus | null>(null);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  async function load() {
    const s = await fetchJobs();
    setStatus(s);
  }

  async function handleRetry(jobId: string) {
    await retryJob(jobId);
    await load();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontSize: '0.8rem' }}>
      <div style={{ padding: '6px 8px', borderBottom: '1px solid #313244' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ color: '#cdd6f4' }}>Processor</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <StatusDot status={status?.processor_running ? 'connected' : 'offline'} />
            <button style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'transparent', border: '1px solid #444', borderRadius: 3, color: '#6c7086', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
              {status?.processor_running ? <><Pause size={10} /> Pause</> : <><Play size={10} /> Resume</>}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, fontSize: '0.65rem' }}>
          <span style={{ color: '#f9e2af' }}>● {status?.pending.length ?? 0} pending</span>
          <span style={{ color: '#89b4fa' }}>● {status?.processing ? 1 : 0} processing</span>
          <span style={{ color: '#a6e3a1' }}>● {status?.completed_count ?? 0} done</span>
          <span style={{ color: '#f38ba8' }}>● {status?.failed.length ?? 0} failed</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {status?.processing && (
          <>
            <SectionHeader>Processing Now</SectionHeader>
            <div style={{ background: '#1e1e2e', borderRadius: 6, padding: '6px 8px', marginBottom: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#cdd6f4' }}>{status.processing.title}</span>
                <span style={{ color: 'var(--accent, #89b4fa)', fontSize: '0.65rem' }}>{status.processing.type}</span>
              </div>
              {status.processing.progress !== undefined && (
                <div style={{ background: '#313244', borderRadius: 4, height: 4 }}>
                  <div style={{ background: 'var(--accent, #89b4fa)', height: 4, borderRadius: 4, width: `${status.processing.progress}%`, transition: 'width 0.3s' }} />
                </div>
              )}
            </div>
          </>
        )}

        {status?.pending && status.pending.length > 0 && (
          <>
            <SectionHeader>Pending</SectionHeader>
            {status.pending.map(job => (
              <div key={job.id} style={{ background: '#313244', borderRadius: 5, padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#cdd6f4', fontSize: '0.75rem' }}>{job.title}</div>
                  <div style={{ color: '#6c7086', fontSize: '0.65rem' }}>{job.type}</div>
                </div>
              </div>
            ))}
          </>
        )}

        {status?.failed && status.failed.length > 0 && (
          <>
            <SectionHeader>Failed</SectionHeader>
            {status.failed.map(job => (
              <div key={job.id} style={{ background: '#1e1e2e', borderLeft: '3px solid #f38ba8', borderRadius: 4, padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#cdd6f4', fontSize: '0.75rem' }}>{job.title}</div>
                  <div style={{ color: '#f38ba8', fontSize: '0.65rem' }}>{job.error}</div>
                </div>
                <button onClick={() => handleRetry(job.id)} style={{ background: 'transparent', border: 'none', color: 'var(--accent, #89b4fa)', fontSize: '0.7rem', cursor: 'pointer' }}>
                  Retry
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      <div style={{ padding: '6px 8px', borderTop: '1px solid #313244', display: 'flex', gap: 6 }}>
        <button style={{ fontSize: '0.7rem', padding: '3px 8px', background: '#313244', border: '1px solid #444', borderRadius: 4, color: '#cdd6f4', cursor: 'pointer' }}>
          Retry all failed
        </button>
        <button style={{ fontSize: '0.7rem', padding: '3px 8px', background: '#313244', border: '1px solid #444', borderRadius: 4, color: '#cdd6f4', cursor: 'pointer' }}>
          Clear completed
        </button>
      </div>
    </div>
  );
}
