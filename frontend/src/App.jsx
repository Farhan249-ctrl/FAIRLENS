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
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '0 32px', display: 'flex', alignItems: 'center', gap: 4
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '14px 18px', fontFamily: 'var(--sans)', fontSize: 13,
              fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? 'var(--text)' : 'var(--muted)',
              borderBottom: activeTab === tab.id ? '2px solid var(--green)' : '2px solid transparent',
              transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 8,
              marginBottom: -1,
            }}
          >
            {tab.label}
            {tab.wow && (
              <span style={{
                background: 'var(--red)', color: '#fff', fontSize: 9, fontWeight: 700,
                fontFamily: 'var(--mono)', padding: '1px 5px', borderRadius: 3,
                letterSpacing: '0.08em'
              }}>WOW</span>
            )}
            {!tab.wow && (
              <span style={{
                background: 'var(--surface2)', color: 'var(--muted)',
                fontSize: 9, fontFamily: 'var(--mono)', padding: '1px 6px',
                borderRadius: 3, border: '1px solid var(--border)'
              }}>{tab.layer}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
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
