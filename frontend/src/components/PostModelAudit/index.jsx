import React, { useState } from 'react';
import { runPostmodelAudit } from '../../api/fairlens';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

export default function PostModelAudit({ onComplete }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [sensitiveAttr, setSensitiveAttr] = useState('gender');

  const run = async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await runPostmodelAudit({
        use_demo: true, sensitive_attr: sensitiveAttr,
        label_col: 'loan_approved', privileged_val: sensitiveAttr === 'gender' ? 'Male' : sensitiveAttr === 'caste' ? 'General' : 'Hindu',
      });
      setResults(data);
      onComplete && onComplete(data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  const METRIC_LABELS = {
    statistical_parity: 'SPD',
    disparate_impact: 'DI',
    equal_opportunity: 'EOD',
    average_odds: 'AOD',
    consistency: 'CS',
    calibration: 'CAL',
  };

  const radarData = results ? Object.entries(results.metrics).map(([key, m]) => ({
    subject: METRIC_LABELS[key] || key,
    score: m.fair ? 100 : Math.max(10, 100 - Math.abs(m.value || 0) * 200),
    fullMark: 100,
  })) : [];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', background: 'var(--surface2)', padding: '3px 10px', borderRadius: 4, border: '1px solid var(--border)' }}>LAYER 2</span>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Post-Model Decision Audit</h1>
      </div>
      <p style={{ color: 'var(--muted2)', fontSize: 13, marginBottom: 24 }}>
        Train model on demo data. Audit real predictions across all 6 fairness metrics.
      </p>

      {!results && (
        <div className="card" style={{ maxWidth: 500 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted2)', display: 'block', marginBottom: 8 }}>ATTRIBUTE TO TEST</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['gender', 'caste', 'religion'].map(opt => (
                <button key={opt} onClick={() => setSensitiveAttr(opt)}
                  style={{
                    padding: '6px 14px', borderRadius: 5, border: `1px solid ${sensitiveAttr === opt ? 'var(--green)' : 'var(--border)'}`,
                    background: sensitiveAttr === opt ? 'var(--green-dim)' : 'transparent',
                    color: sensitiveAttr === opt ? 'var(--green)' : 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12, cursor: 'pointer',
                  }}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <button className="btn-primary" onClick={run} disabled={loading}>
            {loading ? 'Training model & auditing...' : 'Run Post-Model Audit →'}
          </button>
          {error && <p style={{ color: 'var(--red)', fontSize: 12, fontFamily: 'var(--mono)', marginTop: 10 }}>Error: {error}</p>}
        </div>
      )}

      {results && (
        <div>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'FAIR METRICS', value: `${results.fair_count}/${results.total_metrics}`, color: 'var(--green)' },
              { label: 'BIAS SCORE', value: `${results.bias_score}`, color: results.bias_score > 25 ? 'var(--red)' : 'var(--amber)', suffix: '/100' },
              { label: 'MODEL ACCURACY', value: `${(results.model_accuracy * 100).toFixed(1)}%`, color: 'var(--text)' },
            ].map(({ label, value, color, suffix }) => (
              <div key={label} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 8 }}>{label}</div>
                <div style={{ fontSize: 30, fontWeight: 800, fontFamily: 'var(--mono)', color }}>
                  {value}<span style={{ fontSize: 14, color: 'var(--muted)' }}>{suffix}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Radar */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>FAIRNESS RADAR — ALL 6 METRICS</div>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>Higher = More Fair</p>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1e1e38" />
                <PolarAngleAxis dataKey="subject" tick={{ fontFamily: 'Space Mono', fontSize: 11, fill: '#8080a8' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#5a5a80' }} />
                <Radar name="Fairness" dataKey="score" stroke="#00e87a" fill="#00e87a" fillOpacity={0.15} strokeWidth={2} />
                <Tooltip contentStyle={{ background: '#0d0d1a', border: '1px solid #1e1e38', fontFamily: 'Space Mono', fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* All metrics table */}
          <div className="card">
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>ALL METRICS DETAIL</div>
            {Object.entries(results.metrics).map(([key, m]) => (
              <div key={key} className="metric-row">
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{m.metric}</div>
                  <div className="metric-formula mono">{m.formula}</div>
                  <div className="metric-name" style={{ marginTop: 4 }}>{m.interpretation}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                  <div className="metric-value mono" style={{ color: m.fair ? 'var(--green)' : 'var(--red)' }}>
                    {m.value ?? 'N/A'}
                  </div>
                  <span className={`badge ${m.fair ? 'badge-fair' : 'badge-biased'}`} style={{ marginTop: 6, display: 'inline-block' }}>
                    {m.verdict}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button className="btn-ghost" style={{ marginTop: 16 }} onClick={() => setResults(null)}>← Re-run</button>
        </div>
      )}
    </div>
  );
}
