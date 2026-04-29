import React, { useState } from 'react';
import { runPremodelAudit } from '../../api/fairlens';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { maskPII, parseCSV } from '../../utils/privacyMask';

const SENSITIVE_OPTIONS = ['gender', 'caste', 'religion'];
const PRIVILEGED_MAP = { gender: 'Male', caste: 'General', religion: 'Hindu' };

export default function PreModelAudit({ onComplete }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [sensitiveAttr, setSensitiveAttr] = useState('gender');
  const [privilegedVal, setPrivilegedVal] = useState('Male');
  const [piiReport, setPiiReport] = useState(null);
  const [intersectional, setIntersectional] = useState(null);
  const [loadingInter, setLoadingInter] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const rows = parseCSV(text);
      const { maskedRows, maskedColumns, report } = maskPII(rows);
      setPiiReport(report);
      console.log('PII masked. Ready to upload.', maskedColumns);
    };
    reader.readAsText(file);
  };

  const runIntersectional = async () => {
    setLoadingInter(true);
    try {
      const res = await fetch('/api/premodel/intersectional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attr1: 'gender', attr2: 'caste', label_col: 'loan_approved' })
      });
      const data = await res.json();
      setIntersectional(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInter(false);
    }
  };

  const runAudit = async (useDemo) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await runPremodelAudit({
        use_demo: useDemo,
        sensitive_attr: sensitiveAttr,
        label_col: 'loan_approved',
        privileged_val: privilegedVal,
      });
      setResults(data);
      setStep(3);
      onComplete && onComplete(data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  const verdictColor = (v) => v === 'FAIR' ? 'var(--green)' : v === 'BIASED' ? 'var(--red)' : 'var(--amber)';

  return (
    <div>
      {/* Layer badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', background: 'var(--surface2)', padding: '3px 10px', borderRadius: 4, border: '1px solid var(--border)' }}>LAYER 1</span>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Pre-Model Data Audit</h1>
        <span style={{ color: 'var(--muted)', fontSize: 13 }}>— Inspect data BEFORE the model is built</span>
      </div>

      {/* Step indicators */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 32 }}>
        {['Upload Data', 'Configure', 'Results'].map((label, i) => (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: step > i + 1 ? 'var(--green)' : step === i + 1 ? 'var(--green-dim)' : 'var(--surface2)',
                border: `1px solid ${step >= i + 1 ? 'var(--green)' : 'var(--border)'}`,
                fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
                color: step > i + 1 ? '#000' : step === i + 1 ? 'var(--green)' : 'var(--muted)',
              }}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 13, color: step >= i + 1 ? 'var(--text)' : 'var(--muted)', fontWeight: step === i + 1 ? 700 : 400 }}>{label}</span>
            </div>
            {i < 2 && <div style={{ width: 40, height: 1, background: 'var(--border)', alignSelf: 'center', margin: '0 12px' }} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="card" style={{ maxWidth: 600 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 6 }}>Upload your dataset or try the demo</h3>
          <p style={{ color: 'var(--muted2)', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
            The demo dataset contains 600 rows of Indian loan applications with gender, caste, and religion bias deliberately embedded — ready to detect immediately.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-ghost" onClick={() => setStep(2)}>
              Upload CSV
            </button>
            <button className="btn-india" onClick={() => { setStep(2); }}>
              <span style={{ marginRight: 6, opacity: 0.7, fontSize: 10 }}>🇮🇳</span>
              Load India Loan Demo Dataset
            </button>
          </div>
          {piiReport && (
            <div style={{
              marginTop: 12, padding: '10px 14px',
              background: 'rgba(0,232,122,0.08)', border: '1px solid rgba(0,232,122,0.25)',
              borderRadius: 6, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--green)'
            }}>
              {piiReport}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Configure */}
      {step === 2 && (
        <div className="card" style={{ maxWidth: 600 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Configure Audit Parameters</h3>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--muted2)', display: 'block', marginBottom: 6 }}>
              SENSITIVE ATTRIBUTE TO TEST
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {SENSITIVE_OPTIONS.map(opt => (
                <button key={opt} onClick={() => { setSensitiveAttr(opt); setPrivilegedVal(PRIVILEGED_MAP[opt]); }}
                  style={{
                    padding: '8px 16px', borderRadius: 6, border: `1px solid ${sensitiveAttr === opt ? 'var(--green)' : 'var(--border)'}`,
                    background: sensitiveAttr === opt ? 'var(--green-dim)' : 'var(--surface2)',
                    color: sensitiveAttr === opt ? 'var(--green)' : 'var(--muted2)',
                    fontFamily: 'var(--mono)', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 24, padding: '12px 14px', background: 'var(--surface2)', borderRadius: 6, border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--muted2)' }}>PRIVILEGED GROUP: </span>
            <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text)' }}>{privilegedVal}</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-ghost" onClick={() => setStep(1)}>← Back</button>
            <button className="btn-primary" onClick={() => runAudit(true)} disabled={loading}>
              {loading ? 'Running Audit...' : 'Run Pre-Model Audit →'}
            </button>
          </div>
          {error && <p style={{ color: 'var(--red)', fontFamily: 'var(--mono)', fontSize: 12, marginTop: 12 }}>Error: {error}</p>}
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && results && (
        <div>
          {/* Verdict hero */}
          <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>OVERALL VERDICT</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: verdictColor(results.audit_results.verdict) }}>
                {results.audit_results.verdict}
              </div>
              <div style={{ color: 'var(--muted2)', fontSize: 13, marginTop: 4 }}>
                {results.dataset_info.rows} rows · {results.dataset_info.sensitive_attr} attribute · {results.dataset_info.privileged_val} as privileged group
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 48, fontWeight: 700, color: verdictColor(results.audit_results.verdict) }}>
                {results.audit_results.bias_score}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>BIAS SCORE /100</div>
            </div>
          </div>

          {/* 3 key metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              { key: 'statistical_parity', label: 'Statistical Parity Difference', abbr: 'SPD' },
              { key: 'disparate_impact',   label: 'Disparate Impact Ratio',        abbr: 'DI' },
              { key: 'theil_index',        label: 'Theil Index',                   abbr: 'T' },
            ].map(({ key, label, abbr }) => {
              const m = results.audit_results[key];
              return (
                <div key={key} className="card" style={{ borderColor: m.fair ? 'rgba(0,232,122,0.2)' : 'rgba(255,51,85,0.2)' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>{abbr}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--mono)', color: m.fair ? 'var(--green)' : 'var(--red)' }}>
                    {m.value}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted2)', marginTop: 4 }}>{label}</div>
                  {key === 'statistical_parity' && (
                    <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)', marginTop: 6 }}>
                      {m.value < 0 ? 
                        `Female group receives loans ${Math.abs(m.value * 100).toFixed(1)}% less often than Male group` :
                        `Female group receives loans ${(m.value * 100).toFixed(1)}% more often than Male group`
                      }
                    </div>
                  )}
                  <span className={`badge ${m.fair ? 'badge-fair' : 'badge-biased'}`} style={{ marginTop: 8, display: 'inline-block' }}>
                    {m.verdict}
                  </span>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', marginTop: 8 }}>
                    threshold: {m.threshold || `${m.threshold_min}–${m.threshold_max}`}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Group approval rates bar chart */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>APPROVAL RATES BY GROUP</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={Object.entries(results.audit_results.group_approval_rates).map(([name, val]) => ({ name, rate: Math.round(val * 100) }))}>
                <XAxis dataKey="name" tick={{ fontFamily: 'Space Mono', fontSize: 11, fill: '#8080a8' }} />
                <YAxis tick={{ fontFamily: 'Space Mono', fontSize: 10, fill: '#8080a8' }} unit="%" domain={[0, 100]} />
                <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: '#0d0d1a', border: '1px solid #1e1e38', fontFamily: 'Space Mono', fontSize: 11 }} />
                <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                  {Object.keys(results.audit_results.group_approval_rates).map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#ff3355' : '#00e87a'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Interpretations */}
          <div className="card">
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 14 }}>METRIC INTERPRETATIONS</div>
            {['statistical_parity', 'disparate_impact', 'theil_index'].map(key => {
              const m = results.audit_results[key];
              return (
                <div key={key} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span className={`dot-${m.fair ? 'green' : 'red'}`} style={{ marginTop: 4, flexShrink: 0 }} />
                  <p style={{ fontSize: 13, color: 'var(--muted2)', lineHeight: 1.6 }}>{m.interpretation}</p>
                </div>
              );
            })}
          </div>

          {results && !intersectional && (
          <button className="btn-india" style={{ marginTop: 16 }} onClick={runIntersectional} disabled={loadingInter}>
            {loadingInter ? '⟳ Computing...' : '⚡ Run Intersectional Analysis (Gender × Caste)'}
          </button>
        )}

        {intersectional && (
          <div className="card" style={{ marginTop: 16, borderColor: intersectional.severe ? 'rgba(255,51,85,0.4)' : 'rgba(245,158,11,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
                  INTERSECTIONAL BIAS — {intersectional.attr1?.toUpperCase()} × {intersectional.attr2?.toUpperCase()}
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted2)' }}>{intersectional.india_note}</div>
              </div>
              <span className={`badge ${intersectional.severe ? 'badge-biased' : 'badge-border'}`} style={{ flexShrink: 0 }}>
                {intersectional.verdict}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ padding: '12px', background: 'var(--red-dim)', borderRadius: 6, border: '1px solid rgba(255,51,85,0.3)' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 6 }}>MOST DISADVANTAGED</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{intersectional.most_disadvantaged?.group}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--red)', marginTop: 4 }}>
                  {(intersectional.most_disadvantaged?.approval_rate * 100).toFixed(1)}% approval rate
                </div>
              </div>
              <div style={{ padding: '12px', background: 'var(--green-dim)', borderRadius: 6, border: '1px solid rgba(0,232,122,0.3)' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 6 }}>MOST ADVANTAGED</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{intersectional.most_advantaged?.group}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--green)', marginTop: 4 }}>
                  {(intersectional.most_advantaged?.approval_rate * 100).toFixed(1)}% approval rate
                </div>
              </div>
            </div>

            <div style={{ padding: '10px 14px', background: 'var(--surface2)', borderRadius: 6, border: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 13 }}>
              Intersectional gap: <span style={{ color: intersectional.severe ? 'var(--red)' : 'var(--amber)', fontWeight: 700 }}>
                {(intersectional.intersectional_gap * 100).toFixed(1)} percentage points
              </span>
            </div>
          </div>
        )}

        <button className="btn-ghost" style={{ marginTop: 16 }} onClick={() => { setStep(1); setResults(null); setIntersectional(null); }}>
            ← Run new audit
          </button>
        </div>
      )}
    </div>
  );
}
