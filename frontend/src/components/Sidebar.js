import React from 'react';

const NAV = [
  { id: 'dashboard', icon: '⬛', label: 'Dashboard' },
  { id: 'analyse',   icon: '🔍', label: 'Analyse Case' },
  { id: 'queue',     icon: '📋', label: 'Alert Queue' },
];

export default function Sidebar({ page, onNav }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>AML Advisor AI</h1>
        <p>Nordic compliance platform</p>
      </div>
      <nav className="sidebar-nav">
        {NAV.map(n => (
          <div
            key={n.id}
            className={`nav-item ${page === n.id ? 'active' : ''}`}
            onClick={() => onNav(n.id)}
          >
            <span className="nav-icon">{n.icon}</span>
            {n.label}
          </div>
        ))}
      </nav>
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', lineHeight: 1.5 }}>
          LangGraph · LangChain RAG<br />
          ChromaDB · Ollama llama3<br />
          .NET 8 · Python FastAPI
        </p>
      </div>
    </aside>
  );
}
