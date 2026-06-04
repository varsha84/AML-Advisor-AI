import React from 'react';

function riskClass(level) {
  if (level === 'HIGH')   return 'high';
  if (level === 'MEDIUM') return 'medium';
  return 'low';
}

function decisionColor(decision) {
  if (decision === 'ESCALATE') return 'btn-danger';
  if (decision === 'MONITOR')  return 'btn-warning';
  return 'btn-success';
}

export default function ResultPanel({ result, onAction }) {
  const rc = riskClass(result.riskLevel);

  return (
    <div className="result-panel">
      <div className="result-header">
        <div className={`score-circle score-${rc}`}>
          {result.riskScore}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <strong style={{ fontSize: 15 }}>{result.customerName || result.customerId}</strong>
            <span className={`badge badge-${rc}`}>{result.riskLevel}</span>
          </div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            {result.customerId} &nbsp;·&nbsp; Analysed {new Date(result.analyzedAt).toLocaleTimeString()}
          </div>
        </div>
        <span className={`badge badge-${rc}`} style={{ fontSize: 13, padding: '5px 14px' }}>
          {result.decision}
        </span>
      </div>

      <div className="result-body">

        {/* AI Explanation */}
        <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 600, color: '#374151' }}>
          AI Explanation
        </div>
        <div className="explanation-box">
          {result.explanation}
        </div>

        {/* Detected patterns */}
        {result.detectedPatterns?.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Detected patterns
            </div>
            <div className="pattern-list">
              {result.detectedPatterns.map(p => (
                <span key={p} className="badge badge-blue">
                  {p.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Similar cases */}
        {result.similarCases?.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Similar past cases
            </div>
            <div className="pattern-list">
              {result.similarCases.map(c => (
                <span key={c} className="badge badge-gray">{c}</span>
              ))}
            </div>
          </div>
        )}

        {/* Regulation reference */}
        {result.regulationReference && (
          <div className="regulation-ref">
            <span style={{ fontWeight: 600, color: '#374151' }}>Regulation: </span>
            {result.regulationReference}
          </div>
        )}

        {/* Action buttons */}
        <div className="decision-actions">
          <button className="btn btn-success" onClick={() => onAction('approve', result)}>
            ✓ Approve
          </button>
          <button className="btn btn-warning" onClick={() => onAction('monitor', result)}>
            👁 Monitor
          </button>
          <button className="btn btn-danger" onClick={() => onAction('escalate', result)}>
            ⚠ Escalate + SAR
          </button>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 11, color: '#9ca3af', alignSelf: 'center', textAlign: 'right' }}>
            {result.advisedBy}
          </div>
        </div>
      </div>
    </div>
  );
}
