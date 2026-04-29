import React from 'react';

export default function Navbar() {
  return (
    <header style={{
      background: 'rgba(12,12,16,0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 36px',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="dot-live" />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            color: 'var(--text)',
            letterSpacing: '-0.01em',
          }}>
            FairLens
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text3)',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            padding: '1px 7px',
            borderRadius: 5,
          }}>
            v1.0
          </span>
        </div>

        <div style={{ width: 1, height: 18, background: 'var(--border2)' }} />

        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 12,
          color: 'var(--text3)',
          fontWeight: 400,
        }}>
          Unbiased AI Decision Audit · Google Solution Challenge 2026
        </span>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text3)',
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          padding: '3px 10px',
          borderRadius: 6,
          letterSpacing: '0.06em',
        }}>
          3-Layer Framework
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--info)',
          background: 'var(--info-dim)',
          border: '1px solid rgba(91,143,212,0.2)',
          padding: '3px 10px',
          borderRadius: 6,
          letterSpacing: '0.06em',
        }}>
          🇮🇳 India-Specific
        </span>
      </div>
    </header>
  );
}
