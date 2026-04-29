import React, { useState } from 'react';
import { runBiasMirror } from '../../api/fairlens';

const DEFAULT_ROW = {
  gender: 'Female', caste: 'SC', religion: 'Muslim',
  monthly_income: 35000, credit_score: 680,
  loan_amount_requested: 200000, employment_type: 'Salaried',
  education: 'Graduate', existing_loans: 1, state: 'Bihar',
};

export default function BiasMirror() {
  const [row, setRow] = useState(DEFAULT_ROW);
  const [sensitiveAttr, setSensitiveAttr] = useState('gender');
  const [flipTo, setFlipTo] = useState('Male');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const FLIP_OPTIONS = {
    gender: { from: ['Female', 'Male'], to: { Female: 'Male', Male: 'Female' } },
    caste: { from: ['SC', 'ST', 'OBC', 'General'], to: { SC: 'General', ST: 'General', OBC: 'General', General: 'SC' } },
    religion: { from: ['Muslim', 'Christian', 'Hindu'], to: { Muslim: 'Hindu', Christian: 'Hindu', Hindu: 'Muslim' } },
  };

  const runMirror = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await runBiasMirror({
        row: { ...row, loan_approved: 0 },
        sensitive_attr: sensitiveAttr,
        flip_to: flipTo,
      });
      console.log('Mirror result:', data);
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', background: 'var(--surface2)', padding: '3px 10px', borderRadius: 4, border: '1px solid var(--border)' }}>COUNTERFACTUAL</span>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Bias Mirror</h1>
        <span style={{ background: 'var(--red)', color: '#fff', fontSize: 9, fontWeight: 700, fontFamily: 'var(--mono)', padding: '2px 6px', borderRadius: 3, letterSpacing: '0.08em' }}>WOW</span>
      </div>
      <p style={{ color: 'var(--muted2)', fontSize: 13, marginBottom: 28, lineHeight: 1.6 }}>
        Flip ONE protected attribute. Keep everything else identical. If the decision changes — that is bias.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left: Applicant form */}
        <div className="card">
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>APPLICANT PROFILE</div>

          {/* Sensitive attr selector */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted2)', display: 'block', marginBottom: 6 }}>TEST ATTRIBUTE</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {['gender', 'caste', 'religion'].map(opt => (
                <button key={opt} onClick={() => {
                  setSensitiveAttr(opt);
                  const defaultVal = FLIP_OPTIONS[opt].from[0];
                  setRow(r => ({ ...r, [opt]: defaultVal }));
                  setFlipTo(FLIP_OPTIONS[opt].to[defaultVal]);
                }}
                  style={{
                    padding: '5px 12px', borderRadius: 5, border: `1px solid ${sensitiveAttr === opt ? 'var(--green)' : 'var(--border)'}`,
                    background: sensitiveAttr === opt ? 'var(--green-dim)' : 'transparent',
                    color: sensitiveAttr === opt ? 'var(--green)' : 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer',
                  }}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Current attr value */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted2)', display: 'block', marginBottom: 6 }}>
              CURRENT {sensitiveAttr.toUpperCase()} VALUE
            </label>
            <select value={row[sensitiveAttr]} onChange={(e) => {
              const val = e.target.value;
              setRow(r => ({ ...r, [sensitiveAttr]: val }));
              setFlipTo(FLIP_OPTIONS[sensitiveAttr].to[val] || FLIP_OPTIONS[sensitiveAttr].from.find(v => v !== val));
            }}
              style={{ width: '100%', padding: '8px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 5, fontFamily: 'var(--mono)', fontSize: 13 }}>
              {FLIP_OPTIONS[sensitiveAttr].from.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>

          {/* Financial fields */}
          {[
            { key: 'monthly_income', label: 'MONTHLY INCOME (₹)', type: 'number' },
            { key: 'credit_score', label: 'CREDIT SCORE', type: 'number' },
            { key: 'loan_amount_requested', label: 'LOAN AMOUNT (₹)', type: 'number' },
          ].map(({ key, label, type }) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted2)', display: 'block', marginBottom: 4 }}>{label}</label>
              <input type={type} value={row[key]} onChange={(e) => setRow(r => ({ ...r, [key]: Number(e.target.value) }))}
                style={{ width: '100%', padding: '8px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 5, fontFamily: 'var(--mono)', fontSize: 13 }} />
            </div>
          ))}

          <div style={{ padding: '10px 12px', background: 'var(--surface2)', borderRadius: 6, border: '1px solid var(--border2)', marginTop: 8 }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted2)' }}>WILL FLIP TO → </span>
            <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--purple)' }}>{flipTo}</span>
          </div>

          <button className="btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={runMirror} disabled={loading}>
            {loading ? '🔬 Running Mirror Test...' : '⟳ Run Bias Mirror'}
          </button>
          {error && <p style={{ color: 'var(--red)', fontFamily: 'var(--mono)', fontSize: 12, marginTop: 10 }}>Error: {error}</p>}
        </div>

        {/* Right: Result */}
        <div>
          {!result && !loading && (
            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⟳</div>
              <p style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12, textAlign: 'center' }}>
                Configure an applicant profile<br />and run the mirror test
              </p>
            </div>
          )}

          {loading && (
            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, gap: 16 }}>
              <div className="spinner" />
              <p style={{ color: 'var(--muted2)', fontFamily: 'var(--mono)', fontSize: 12 }}>Flipping attribute and re-running model...</p>
            </div>
          )}

          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* BIAS CONFIRMED Banner */}
              {result.bias_detected && (
                <div style={{
                  background: 'var(--red-dim)', border: '2px solid var(--red)',
                  borderRadius: 8, padding: '16px', textAlign: 'center', marginBottom: 12
                }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 800, color: 'var(--red)' }}>
                    ⚠ BIAS CONFIRMED
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--muted2)', marginTop: 6 }}>
                    Decision changed when ONLY {sensitiveAttr} was flipped.
                    Confidence shifted {Math.abs((result.original.confidence || 0) - (result.flipped.confidence || 0)).toFixed(1)}%.
                  </div>
                </div>
              )}

              {/* Decision comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {/* Original */}
                <div className="card" style={{ textAlign: 'center', borderColor: result.original.decision === 1 ? 'rgba(0,232,122,0.3)' : 'rgba(255,51,85,0.3)' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 8 }}>ORIGINAL</div>
                  <div style={{ fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--muted2)', marginBottom: 6 }}>{sensitiveAttr} = <strong style={{ color: 'var(--text)' }}>{result.original.value}</strong></div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: result.original.decision === 1 ? 'var(--green)' : 'var(--red)' }}>
                    {result.original.decision === 1 ? 'APPROVED' : 'REJECTED'}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted2)', marginTop: 6 }}>
                    {result.original.confidence}% confidence
                  </div>
                </div>

                {/* Flipped */}
                <div className="card" style={{ textAlign: 'center', borderColor: result.flipped.decision === 1 ? 'rgba(0,232,122,0.3)' : 'rgba(255,51,85,0.3)' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--purple)', marginBottom: 8 }}>FLIPPED</div>
                  <div style={{ fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--muted2)', marginBottom: 6 }}>{sensitiveAttr} = <strong style={{ color: 'var(--purple)' }}>{result.flipped.value}</strong></div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: result.flipped.decision === 1 ? 'var(--green)' : 'var(--red)' }}>
                    {result.flipped.decision === 1 ? 'APPROVED' : 'REJECTED'}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted2)', marginTop: 6 }}>
                    {result.flipped.confidence}% confidence
                  </div>
                </div>
              </div>

              {/* Verdict */}
              <div className="card" style={{ borderColor: result.bias_detected ? 'rgba(255,51,85,0.4)' : 'rgba(0,232,122,0.4)', background: result.bias_detected ? 'var(--red-dim)' : 'var(--green-dim)' }}>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: result.bias_detected ? 'var(--red)' : 'var(--green)', marginBottom: 8 }}>
                  {result.verdict}
                </p>
                {result.bias_detected && (
                  <p style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.6 }}>
                    Confidence shifted by <strong style={{ color: 'var(--red)', fontFamily: 'var(--mono)' }}>{result.confidence_shift}%</strong> when only {sensitiveAttr} was changed.
                  </p>
                )}
              </div>

              {/* India context */}
              <div className="card" style={{ borderColor: 'rgba(139,92,246,0.3)', background: 'var(--purple-dim)' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--purple)', marginBottom: 6 }}>🇮🇳 INDIA LEGAL CONTEXT</div>
                <p style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.6 }}>{result.india_context}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
