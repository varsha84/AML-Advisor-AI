import React, { useState } from 'react';

const ALERTS = [
  { id: 1, customerId: 'C-8841', name: 'Erik Johansson',  riskScore: 100, riskLevel: 'HIGH',   decision: 'ESCALATE', patterns: ['rapid_fund_movement', 'dormant_account_activation', 'high_risk_country'], regulation: 'EBA Guidelines on risk factors', time: '09:49', status: 'open' },
  { id: 2, customerId: 'C-1042', name: 'Lars Andersen',   riskScore: 45,  riskLevel: 'MEDIUM', decision: 'MONITOR',  patterns: ['structuring'], regulation: 'FATF Recommendation 16', time: '10:12', status: 'open' },
  { id: 3, customerId: 'C-3391', name: 'Maria Nielsen',   riskScore: 50,  riskLevel: 'MEDIUM', decision: 'MONITOR',  patterns: ['money_mule_pattern'], regulation: 'Europol — money mule typology', time: '10:33', status: 'reviewing' },
  { id: 4, customerId: 'C-0021', name: 'Anna Sørensen',   riskScore: 0,   riskLevel: 'LOW',    decision: 'APPROVE',  patterns: [], regulation: 'Standard AML monitoring', time: '11:01', status: 'closed' },
];

function riskClass(l) {
  if (l === 'HIGH')   return 'high';
  if (l === 'MEDIUM') return 'medium';
  return 'low';
}

export default function AlertQueue({ onOpenCase }) {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all'
    ? ALERTS
    : ALERTS.filter(a => a.riskLevel.toLowerCase() === filter || a.status === filter);

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Alert Queue</h2>
          <p>All AML alerts sorted by risk score — highest first</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'HIGH', 'MEDIUM', 'LOW'].map(f => (
            <button key={f}
              className={`btn btn-outline btn-sm ${filter === f ? 'active' : ''}`}
              style={filter === f ? { background: '#1a1a2e', color: '#fff', borderColor: '#1a1a2e' } : {}}
              onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>

      <div className="page-body">
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Risk</th>
                  <th>Customer</th>
                  <th>Patterns detected</th>
                  <th>Regulation</th>
                  <th>Decision</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(alert => (
                  <tr key={alert.id}>
                    <td>
                      <div className={`score-circle score-${riskClass(alert.riskLevel)}`} style={{ width: 38, height: 38, fontSize: 13 }}>
                        {alert.riskScore}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{alert.name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{alert.customerId}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {alert.patterns.length > 0
                          ? alert.patterns.map(p => (
                              <span key={p} className="badge badge-blue" style={{ fontSize: 10 }}>
                                {p.replace(/_/g,' ')}
                              </span>
                            ))
                          : <span style={{ color: '#9ca3af', fontSize: 12 }}>none</span>
                        }
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: '#6b7280', maxWidth: 180 }}>
                      {alert.regulation}
                    </td>
                    <td>
                      <span className={`badge badge-${riskClass(alert.riskLevel)}`}>
                        {alert.decision}
                      </span>
                    </td>
                    <td style={{ color: '#6b7280', fontSize: 12 }}>{alert.time}</td>
                    <td>
                      <span className={`badge badge-gray`} style={{ fontSize: 10 }}>
                        {alert.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => onOpenCase(alert)}>
                        Open →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
