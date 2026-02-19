export async function createCheckoutSession(sessionId?: string) {
  const API_URL = import.meta.env.VITE_API_URL;
  if (!API_URL) throw new Error('No API_URL configured');

  const res = await fetch(`${API_URL}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid: sessionId }),
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    throw new Error('Invalid checkout response');
  }

  if (!res.ok) throw data || new Error('Checkout creation failed');
  if (!data?.url) throw new Error('No checkout url returned');
  return data.url as string;
}
