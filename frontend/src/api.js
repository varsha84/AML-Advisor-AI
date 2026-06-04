// All API calls go through here
// .NET API runs on http://localhost:5000
// React proxy in package.json forwards /api/* to port 5000

const BASE = '/api/advisor';

export async function analyseTransactions(request) {
  const response = await fetch(`${BASE}/analyse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function checkHealth() {
  const response = await fetch(`${BASE}/health`);
  return response.json();
}
