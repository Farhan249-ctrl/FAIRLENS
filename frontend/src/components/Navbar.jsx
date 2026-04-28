import React from 'react';

export default function Navbar() {
  return (
    <header style={{
      background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      padding: '0 32px', height: 56, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="dot-green" />
        <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 15, letterSpacing: '0.05em' }}>
          FairLens
        </span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', background: 'var(--surface2)', padding: '2px 7px', borderRadius: 4, border: '1px solid var(--border)' }}>
          v1.0
        </span>
        <span style={{ color: 'var(--muted)', fontSize: 12, marginLeft: 8 }}>
          Unbiased AI Decision Audit System · Google Solution Challenge 2026
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <span className="badge badge-fair">3-Layer Framework</span>
        <span style={{
          background: 'var(--purple-dim)', color: 'var(--purple)',
          border: '1px solid rgba(139,92,246,0.3)', padding: '2px 10px',
          borderRadius: 4, fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700
        }}>India-Specific</span>
      </div>
    </header>
  );
}
