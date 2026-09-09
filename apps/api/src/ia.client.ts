const IA_URL = process.env.IA_URL || 'http://localhost:9503';

export async function callIA(path: string, payload: unknown) {
  const res = await fetch(`${IA_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`IA service error ${res.status}: ${text}`);
  }
  return res.json();
}
