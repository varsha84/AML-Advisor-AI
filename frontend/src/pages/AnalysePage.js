import React, { useState } from 'react';
import { analyseTransactions } from '../api';
import ResultPanel from '../components/ResultPanel';

const EMPTY_TX = () => ({
  id: `T-${Date.now()}`,
  amount: '',
  type: 'cash_deposit',
  timestamp: new Date().toISOString().slice(0, 16),
  counterpartyCountry: '',
  description: '',
});

const TX_TYPES = [
  'cash_deposit', 'cash_withdrawal', 'wire_in', 'wire_out', 'transfer'
];

const SCENARIOS = {
  structuring: {
    label: 'Structuring',
    customerId: 'C-1042', name: 'Lars Andersen', country: 'DK',
    accountType: 'personal', accountAgeDays: 540, lastActivityDays: 5,
    transactions: [
      { id: 'T-001', amount: 9500, type: 'cash_deposit', timestamp: '2024-03-01T09:00', counterpartyCountry: '', description: 'Cash deposit Copenhagen branch' },
      { id: 'T-002', amount: 9200, type: 'cash_deposit', timestamp: '2024-03-02T11:00', counterpartyCountry: '', description: 'Cash deposit Aarhus branch' },
      { id: 'T-003', amount: 9800, type: 'cash_deposit', timestamp: '2024-03-04T14:00', counterpartyCountry: '', description: 'Cash deposit Odense branch' },
      { id: 'T-004', amount: 9100, type: 'cash_deposit', timestamp: '2024-03-05T10:00', counterpartyCountry: '', description: 'Cash deposit Aalborg branch' },
    ]
  },
  dormant: {
    label: 'Dormant + Rapid',
    customerId: 'C-8841', name: 'Erik Johansson', country: 'SE',
    accountType: 'personal', accountAgeDays: 900, lastActivityDays: 210,
    transactions: [
      { id: 'T-001', amount: 45000, type: 'wire_in',  timestamp: '2024-03-10T08:00', counterpartyCountry: 'NG', description: 'International wire received' },
      { id: 'T-002', amount: 44500, type: 'wire_out', timestamp: '2024-03-10T16:30', counterpartyCountry: 'AE', description: 'Outbound transfer' },
    ]
  },
  mule: {
    label: 'Money mule',
    customerId: 'C-3391', name: 'Maria Nielsen', country: 'DK',
    accountType: 'personal', accountAgeDays: 120, lastActivityDays: 2,
    transactions: [
      { id: 'T-001', amount: 5000, type: 'wire_in',  timestamp: '2024-03-05T09:00', counterpartyCountry: 'DK', description: 'Transfer received' },
      { id: 'T-002', amount: 4800, type: 'wire_in',  timestamp: '2024-03-05T10:00', counterpartyCountry: 'DK', description: 'Transfer received' },
      { id: 'T-003', amount: 5200, type: 'wire_in',  timestamp: '2024-03-05T11:00', counterpartyCountry: 'DE', description: 'Transfer received' },
      { id: 'T-004', amount: 5100, type: 'wire_in',  timestamp: '2024-03-05T12:00', counterpartyCountry: 'NL', description: 'Transfer received' },
      { id: 'T-005', amount: 19900, type: 'wire_out', timestamp: '2024-03-06T08:30', counterpartyCountry: 'PA', description: 'Outbound transfer' },
    ]
  },
  clean: {
    label: 'Clean customer',
    customerId: 'C-0021', name: 'Anna Sørensen', country: 'DK',
    accountType: 'personal', accountAgeDays: 1200, lastActivityDays: 3,
    transactions: [
      { id: 'T-001', amount: 3500, type: 'wire_in',         timestamp: '2024-03-01T06:00', counterpartyCountry: 'DK', description: 'Monthly salary' },
      { id: 'T-002', amount: 1200, type: 'wire_out',        timestamp: '2024-03-03T10:00', counterpartyCountry: 'DK', description: 'Rent payment' },
      { id: 'T-003', amount: 85,   type: 'cash_withdrawal', timestamp: '2024-03-05T14:00', counterpartyCountry: '',   description: 'ATM withdrawal' },
    ]
  }
};

export default function AnalysePage({ prefill }) {
  const [form, setForm] = useState(prefill ? null : {
    customerId: '', name: '', country: 'DK',
    accountType: 'personal', accountAgeDays: 365, lastActivityDays: 0,
    transactions: [EMPTY_TX()]
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);
  const [toast, setToast]     = useState(null);

  // load a scenario
  function loadScenario(key) {
    setResult(null);
    setError(null);
    const s = SCENARIOS[key];
    setForm({ ...s, transactions: s.transactions.map(t => ({ ...t })) });
  }

  function setField(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function setTx(index, field, value) {
    setForm(f => {
      const txs = [...f.transactions];
      txs[index] = { ...txs[index], [field]: value };
      return { ...f, transactions: txs };
    });
  }

  function addTx() {
    setForm(f => ({ ...f, transactions: [...f.transactions, EMPTY_TX()] }));
  }

  function removeTx(index) {
    setForm(f => ({
      ...f,
      transactions: f.transactions.filter((_, i) => i !== index)
    }));
  }

  async function handleSubmit() {
    if (!form.customerId.trim()) { setError('Customer ID is required'); return; }
    if (form.transactions.length === 0) { setError('Add at least one transaction'); return; }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      // convert amount strings to numbers and timestamp to ISO string
      const payload = {
        ...form,
        accountAgeDays: Number(form.accountAgeDays),
        lastActivityDays: Number(form.lastActivityDays),
        transactions: form.transactions.map(t => ({
          ...t,
          amount: Number(t.amount),
          timestamp: new Date(t.timestamp).toISOString(),
        }))
      };
      const data = await analyseTransactions(payload);
      setResult(data);
    } catch (e) {
      setError('Could not reach the API. Make sure the .NET server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  }

  function handleAction(action, result) {
    const messages = {
      approve:  `✓ Case ${result.customerId} approved and closed`,
      monitor:  `👁 Case ${result.customerId} added to monitoring queue`,
      escalate: `⚠ Case ${result.customerId} escalated — SAR will be filed`,
    };
    setToast(messages[action]);
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Analyse Case</h2>
          <p>Enter customer transactions to run AML Advisor AI analysis</p>
        </div>
      </div>

      <div className="page-body">

        {/* Scenario quick-load */}
        <div className="card">
          <div className="card-title">Quick load — test scenarios</div>
          <div className="card-sub">Load a pre-built scenario to see the system in action</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(SCENARIOS).map(([key, s]) => (
              <button key={key} className="btn btn-outline" onClick={() => loadScenario(key)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {form && (
          <div className="two-col">

            {/* Left — customer details */}
            <div>
              <div className="card">
                <div className="card-title">Customer details</div>
                <div className="card-sub">Information about the account being analysed</div>

                <div className="form-group">
                  <label className="form-label">Customer ID *</label>
                  <input className="form-input" value={form.customerId}
                    onChange={e => setField('customerId', e.target.value)}
                    placeholder="C-1042" />
                </div>

                <div className="form-group">
                  <label className="form-label">Full name</label>
                  <input className="form-input" value={form.name}
                    onChange={e => setField('name', e.target.value)}
                    placeholder="Lars Andersen" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group">
                    <label className="form-label">Country</label>
                    <input className="form-input" value={form.country}
                      onChange={e => setField('country', e.target.value)}
                      placeholder="DK" maxLength={2} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Account type</label>
                    <select className="form-select" value={form.accountType}
                      onChange={e => setField('accountType', e.target.value)}>
                      <option value="personal">Personal</option>
                      <option value="business">Business</option>
                      <option value="offshore">Offshore</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group">
                    <label className="form-label">Account age (days)</label>
                    <input className="form-input" type="number" value={form.accountAgeDays}
                      onChange={e => setField('accountAgeDays', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last activity (days ago)</label>
                    <input className="form-input" type="number" value={form.lastActivityDays}
                      onChange={e => setField('lastActivityDays', e.target.value)}
                      placeholder="0 = active, 210 = dormant" />
                  </div>
                </div>
              </div>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', color: '#991b1b', fontSize: 13, marginBottom: 12 }}>
                  {error}
                </div>
              )}

              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '11px' }}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <><span className="spinner" /> Analysing — Ollama generating explanation...</>
                ) : (
                  '🔍 Run AML Analysis'
                )}
              </button>

              {loading && (
                <div style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 8 }}>
                  .NET detecting patterns → Python RAG → Ollama writing explanation (10–30s)
                </div>
              )}
            </div>

            {/* Right — transactions */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <div className="card-title">Transactions</div>
                  <div className="card-sub">Add all transactions for this customer</div>
                </div>
                <button className="btn btn-outline btn-sm" onClick={addTx}>+ Add row</button>
              </div>

              {form.transactions.map((tx, i) => (
                <div key={tx.id} style={{ background: '#f9fafb', border: '1px solid #e8ecf0', borderRadius: 8, padding: 10, marginBottom: 8 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <div>
                      <div className="form-label">Amount (€)</div>
                      <input className="form-input" type="number" value={tx.amount}
                        onChange={e => setTx(i, 'amount', e.target.value)} placeholder="9500" />
                    </div>
                    <div>
                      <div className="form-label">Type</div>
                      <select className="form-select" value={tx.type}
                        onChange={e => setTx(i, 'type', e.target.value)}>
                        {TX_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 8, marginBottom: 8 }}>
                    <div>
                      <div className="form-label">Date & time</div>
                      <input className="form-input" type="datetime-local" value={tx.timestamp}
                        onChange={e => setTx(i, 'timestamp', e.target.value)} />
                    </div>
                    <div>
                      <div className="form-label">Country</div>
                      <input className="form-input" value={tx.counterpartyCountry}
                        onChange={e => setTx(i, 'counterpartyCountry', e.target.value)}
                        placeholder="NG" maxLength={2} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <div className="form-label">Description</div>
                      <input className="form-input" value={tx.description}
                        onChange={e => setTx(i, 'description', e.target.value)}
                        placeholder="Cash deposit Copenhagen branch" />
                    </div>
                    {form.transactions.length > 1 && (
                      <button className="btn btn-outline btn-sm" onClick={() => removeTx(i)}
                        style={{ color: '#ef4444', borderColor: '#fca5a5', marginBottom: 1 }}>
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <ResultPanel result={result} onAction={handleAction} />
        )}

        {toast && <div className="toast">{toast}</div>}
      </div>
    </>
  );
}
