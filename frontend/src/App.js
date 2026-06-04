import React, { useState } from 'react';
import './index.css';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AnalysePage from './pages/AnalysePage';
import AlertQueue from './pages/AlertQueue';

export default function App() {
  const [page, setPage]       = useState('dashboard');
  const [prefill, setPrefill] = useState(null);

  // Navigate to Analyse page, optionally pre-loading a scenario
  function openAnalyse(data) {
    setPrefill(data || null);
    setPage('analyse');
  }

  return (
    <div className="app-layout">
      <Sidebar page={page} onNav={p => { setPrefill(null); setPage(p); }} />
      <div className="main-content">
        {page === 'dashboard' && (
          <Dashboard onAnalyse={openAnalyse} />
        )}
        {page === 'analyse' && (
          <AnalysePage prefill={prefill} key={JSON.stringify(prefill)} />
        )}
        {page === 'queue' && (
          <AlertQueue onOpenCase={openAnalyse} />
        )}
      </div>
    </div>
  );
}
