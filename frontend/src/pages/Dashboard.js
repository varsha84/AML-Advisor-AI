import React, { useState, useEffect } from 'react';
import { checkHealth } from '../api';

const DEMO_ALERTS = [
  { id: 1, name: 'Erik Johansson',  customerId: 'C-8841', riskScore: 100, riskLevel: 'HIGH',   decision: 'ESCALATE', patterns: ['rapid_fund_movement', 'dormant_account_activation', 'high_risk_country'], time: '09:49' },
  { id: 2, name: 'Lars Andersen',   customerId: 'C-1042', riskScore: 45,  riskLevel: 'MEDIUM', decision: 'MONITOR',  patterns: ['structuring'], time: '10:12' },
  { id: 3, name: 'Maria Nielsen',   customerId: 'C-3391', riskScore: 50,  riskLevel: 'MEDIUM', decision: 'MONITOR',  patterns: ['money_mule_pattern'], time: '10:33' },
  { id: 4, name: 'Anna Sørensen',   customerId: 'C-0021', riskScore: 0,   riskLevel: 'LOW',    decision: 'APPROVE',  patterns: [], time: '11:01' },
];

function riskClass(l) {
  if (l === 'HIGH')   return 'high';
  if (l === 'MEDIUM') return 'medium';
  return 'low';
}

export default function Dashboard({ onAnalyse }) {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    checkHealth()
      .then(setHealth)
      .catch(() => setHealth({ status: 'offline' }));
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>AML Advisor AI — compliance monitoring overview</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: health?.status === 'running' ? '#10b981' : '#ef4444',
            display: 'inline-block'
          }} />
          <span style={{ fontSize: 12, color: '#6b7280' }}>
            {health?.status === 'running' ? 'All services running' : 'Services offline'}
          </span>
        </div>
      </div>

      <div className="page-body">

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Total alerts today</div>
            <div className="stat-value">4</div>
            <div className="stat-sub">since 09:00</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">High risk</div>
            <div className="stat-value" style={{ color: '#991b1b' }}>1</div>
            <div className="stat-sub">requires escalation</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Under review</div>
            <div className="stat-value" style={{ color: '#92400e' }}>2</div>
            <div className="stat-sub">monitoring</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Approved</div>
            <div className="stat-value" style={{ color: '#065f46' }}>1</div>
            <div className="stat-sub">clean customers</div>
          </div>
        </div>

        <div className="two-col">

          {/* Recent alerts */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f2f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="card-title" style={{ marginBottom: 0 }}>Recent alerts</span>
              <button className="btn btn-outline btn-sm" onClick={() => onAnalyse()}>
                + New analysis
              </button>
            </div>
            {DEMO_ALERTS.map(alert => (
              <div key={alert.id} className="alert-row" onClick={() => onAnalyse(alert)}>
                <div className={`score-circle score-${riskClass(alert.riskLevel)}`} style={{ width: 40, height: 40, fontSize: 13 }}>
                  {alert.riskScore}
                </div>
                <div className="alert-info">
                  <div className="alert-name">{alert.name}</div>
                  <div className="alert-meta">
                    {alert.customerId} · {alert.patterns.length > 0 ? alert.patterns[0].replace(/_/g,' ') : 'no patterns'} · {alert.time}
                  </div>
                </div>
                <span className={`badge badge-${riskClass(alert.riskLevel)}`}>{alert.decision}</span>
              </div>
            ))}
          </div>

          {/* System info */}
          <div>
            <div className="card">
              <div className="card-title">Tech stack</div>
              <div className="card-sub">Running locally — no cloud dependency</div>
              {[
                ['LangGraph', 'Multi-agent orchestration', '#dbeafe', '#1e40af'],
                ['LangChain RAG', 'ChromaDB vector retrieval', '#ede9fe', '#5b21b6'],
                ['Ollama llama3', 'Local LLM — port 11434', '#fef3c7', '#92400e'],
                ['.NET 8 Web API', 'Business logic — port 5000', '#f0fdf4', '#166534'],
                ['Python FastAPI', 'AI layer — port 8000', '#fdf4ff', '#7e22ce'],
              ].map(([name, desc, bg, color]) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ background: bg, color, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 5, minWidth: 110 }}>
                    {name}
                  </span>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>{desc}</span>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-title">AML patterns detected</div>
              <div className="card-sub">C# rule engine — no AI needed for detection</div>
              {['Structuring', 'Rapid fund movement', 'Dormant account activation', 'High risk country', 'Money mule pattern'].map(p => (
                <div key={p} style={{ fontSize: 12, color: '#374151', padding: '4px 0', borderBottom: '1px solid #f0f2f5' }}>
                  · {p}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
