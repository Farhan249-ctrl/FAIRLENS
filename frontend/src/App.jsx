import React, { useState } from 'react';
import Navbar from './components/Navbar';
import PreModelAudit from './components/PreModelAudit';
import BiasMirror from './components/BiasMirror';
import PostModelAudit from './components/PostModelAudit';
import GovernanceTrail from './components/GovernanceTrail';

const TABS = [
  { id: 'premodel',    label: 'Pre-model Audit',  layer: 'Layer 1' },
  { id: 'mirror',      label: 'Bias Mirror',       layer: 'WOW',   wow: true },
  { id: 'postmodel',   label: 'Post-model Audit',  layer: 'Layer 2' },
  { id: 'governance',  label: 'Governance Trail',  layer: 'Layer 3' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('premodel');
  const [sharedState, setSharedState] = useState({
    datasetInfo: null,
    preModelMetrics: null,
    postModelMetrics: null,
  });

  const updateShared = (key, value) =>
    setSharedState(prev => ({ ...prev, [key]: value }));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      {/* Tab Navigation */}
<div style={{
  background: 'var(--surface)',
  borderBottom: '1px solid var(--border)',
  padding: '0 36px',
  display: 'flex',
  gap: 4,
}}>
  {TABS.map(tab => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      style={{
        background: 'none',
        border: 'none',
        borderBottom: `2px solid ${activeTab === tab.id ? 'var(--saffron)' : 'transparent'}`,
        cursor: 'pointer',
        padding: '14px 18px 12px',
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        fontWeight: activeTab === tab.id ? 600 : 400,
        color: activeTab === tab.id ? 'var(--text)' : 'var(--text3)',
        transition: 'all 0.15s',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: -1,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        color: activeTab === tab.id ? 'var(--saffron)' : 'var(--text3)',
        background: activeTab === tab.id ? 'var(--saffron-dim)' : 'var(--surface2)',
        border: `1px solid ${activeTab === tab.id ? 'var(--saffron-glow)' : 'var(--border)'}`,
        padding: '1px 6px',
        borderRadius: 4,
      }}>
        {tab.layer}
      </span>
      {tab.label}
      {tab.wow && (
        <span style={{
          background: 'var(--danger)',
          color: '#fff',
          fontSize: 8,
          fontWeight: 700,
          padding: '1px 5px',
          borderRadius: 4,
          letterSpacing: '0.08em',
          fontFamily: 'var(--font-mono)',
        }}>
          WOW
        </span>
      )}
    </button>
  ))}
</div>

{/* Content */}
<div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 36px' }}>
        {activeTab === 'premodel' && (
          <PreModelAudit
            onComplete={(data) => {
              updateShared('datasetInfo', data.dataset_info);
              updateShared('preModelMetrics', data.audit_results);
            }}
          />
        )}
        {activeTab === 'mirror' && <BiasMirror />}
        {activeTab === 'postmodel' && (
          <PostModelAudit
            onComplete={(data) => updateShared('postModelMetrics', data)}
          />
        )}
        {activeTab === 'governance' && (
          <GovernanceTrail
            preMetrics={sharedState.preModelMetrics}
            postMetrics={sharedState.postModelMetrics}
            datasetInfo={sharedState.datasetInfo}
          />
        )}
      </div>
    </div>
  );
}
