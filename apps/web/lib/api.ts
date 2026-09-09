const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:9502";

export async function classify(text: string) {
  const res = await fetch(`${API_URL}/classify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Error ${res.status}: ${body}`);
  }
  return res.json();
}

export async function generateDocument(
  type: string,
  fields: Record<string, string>,
) {
  const res = await fetch(`${API_URL}/documents/${type}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Error ${res.status}: ${body}`);
  }
  return res.json();
}

export async function analyze(text: string) {
  const res = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Error ${res.status}: ${body}`);
  }
  return res.json();
}
