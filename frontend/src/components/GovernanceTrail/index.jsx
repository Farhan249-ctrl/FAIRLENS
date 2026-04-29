import React, { useState, useEffect } from 'react';
import { generateGovernanceReport, getRemediationSteps, getAuditTrail } from '../../api/fairlens';

export default function GovernanceTrail({ preMetrics, postMetrics, datasetInfo }) {
  const [report, setReport] = useState(null);
  const [remediation, setRemediation] = useState(null);
  const [trail, setTrail] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [loadingRemediation, setLoadingRemediation] = useState(false);
  const [error, setError] = useState(null);
  const [verifications, setVerifications] = useState({});

  const verifyAudit = async (auditId) => {
    const res = await fetch(`/api/governance/verify/${auditId}`);
    const data = await res.json();
    setVerifications(prev => ({ ...prev, [auditId]: data }));
  };

  useEffect(() => {
    getAuditTrail().then(({ data }) => setTrail(data.audit_trail || [])).catch(() => {});
  }, []);

  const generateReport = async () => {
    setLoadingReport(true); setError(null);
    try {
      const metrics = preMetrics || {};
      const { data } = await generateGovernanceReport({
        metrics: { ...metrics, bias_score: metrics?.bias_score, verdict: metrics?.verdict },
        dataset_info: datasetInfo || { name: 'India Loan Dataset', sensitive_attr: 'gender', privileged_val: 'Male', rows: 600 },
      });
      setReport(data);
      getAuditTrail().then(({ data }) => setTrail(data.audit_trail || [])).catch(() => {});
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoadingReport(false);
    }
  };

  const getRemediation = async () => {
    setLoadingRemediation(true);
    try {
      const { data } = await getRemediationSteps({ metrics: preMetrics || postMetrics || {} });
      setRemediation(data.remediation_steps);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoadingRemediation(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', background: 'var(--surface2)', padding: '3px 10px', borderRadius: 4, border: '1px solid var(--border)' }}>LAYER 3</span>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>AI Governance Layer</h1>
      </div>
      <p style={{ color: 'var(--muted2)', fontSize: 13, marginBottom: 24 }}>
        Explainability · Fairness Metrics · Auditability — powered by Gemini
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Generate Report */}
        <div className="card">
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>
            EXPLAINABILITY REPORT <span style={{ color: 'var(--purple)' }}>← Gemini</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted2)', marginBottom: 14, lineHeight: 1.6 }}>
            Generate a human-readable governance report that explains bias findings in plain language, legal context, and required actions.
          </p>
          <button className="btn-india" onClick={generateReport} disabled={loadingReport}>
            {loadingReport ? '✦ Gemini generating...' : '✦ Generate Governance Report'}
          </button>
        </div>

        {/* Remediation */}
        <div className="card">
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>
            REMEDIATION PLAN <span style={{ color: 'var(--purple)' }}>← Gemini</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted2)', marginBottom: 14, lineHeight: 1.6 }}>
            AI-generated step-by-step mitigation plan specific to the detected bias type and severity.
          </p>
          <button className="btn-india" onClick={getRemediation} disabled={loadingRemediation}>
            {loadingRemediation ? '✦ Gemini generating...' : '✦ Get Remediation Steps'}
          </button>
        </div>
      </div>

      {error && <div className="card" style={{ borderColor: 'var(--red)', marginBottom: 16 }}>
        <p style={{ color: 'var(--red)', fontFamily: 'var(--mono)', fontSize: 12 }}>Error: {error}</p>
      </div>}

      {/* Report output */}
      {report && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>GOVERNANCE REPORT</div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--purple)', background: 'var(--purple-dim)', padding: '2px 8px', borderRadius: 3, border: '1px solid rgba(139,92,246,0.3)' }}>
              AUDIT ID: {report.audit_id}
            </span>
          </div>
          <div style={{
            background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6,
            padding: '16px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted2)',
            lineHeight: 1.8, maxHeight: 400, minHeight: 200, overflowY: 'auto', whiteSpace: 'pre-wrap',
          }}>
            {report.report}
          </div>
          <button onClick={() => {
            const blob = new Blob([report.report], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `FairLens_Audit_${report.audit_id}.txt`;
            a.click();
          }} className="btn-ghost" style={{ marginTop: 8 }}>
            ↓ Download Report
          </button>
        </div>
      )}

      {/* Remediation steps */}
      {remediation && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>REMEDIATION STEPS</div>
          {remediation.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: i < remediation.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--green-dim)', border: '1px solid var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: 'var(--green)' }}>
                {step.step}
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{step.action}</div>
                <div style={{ fontSize: 12, color: 'var(--muted2)', fontFamily: 'var(--mono)', marginBottom: 4 }}>{step.method}</div>
                <div style={{ fontSize: 12, color: 'var(--green)' }}>Expected: {step.impact}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audit Trail */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>IMMUTABLE AUDIT TRAIL</div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--green)', background: 'var(--green-dim)', padding: '2px 8px', borderRadius: 3 }}>
            {trail.length} RECORDS
          </span>
        </div>
        {trail.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12, lineHeight: 1.8 }}>
            No audits recorded yet.<br/>
            Run a Pre-Model Audit first, then generate a Governance Report.<br/>
            Every report creates an immutable SHA-256 verified entry here.
          </p>
        ) : (
          trail.map((entry, i) => (
            <div key={i} style={{ padding: '12px 0', borderBottom: i < trail.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--purple)', marginRight: 10 }}>{entry.audit_id}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted2)' }}>{entry.dataset} · {entry.sensitive_attr}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => verifyAudit(entry.audit_id)}
                  style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer' }}>
                  Verify
                </button>
                {verifications[entry.audit_id] && (
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: verifications[entry.audit_id].verified ? 'var(--green)' : 'var(--red)' }}>
                    {verifications[entry.audit_id].verified ? '✅ Intact' : '❌ Tampered'}
                  </span>
                )}
                {entry.integrity_hash && (
                  <span title={`SHA-256: ${entry.integrity_hash}`}
                    style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', cursor: 'help' }}>
                    🔒 {entry.integrity_hash?.slice(0, 24)}...
                  </span>
                )}
                <span className={`badge ${entry.verdict === 'FAIR' ? 'badge-fair' : 'badge-biased'}`}>{entry.verdict}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>{new Date(entry.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
