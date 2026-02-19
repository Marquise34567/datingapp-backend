export async function createCheckoutSession(sessionId?: string) {
  // Prefer Vite env, then Next-style env, then fallback to window global if set by host
  const API = (import.meta as any)?.env?.VITE_API_BASE || (process.env && (process.env.NEXT_PUBLIC_API_BASE as string)) || (window as any).__API_BASE__;
  if (!API) throw new Error('Missing API base URL (set VITE_API_BASE or NEXT_PUBLIC_API_BASE)');

  const res = await fetch(`${API.replace(/\/$/, '')}/api/billing/create-checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ sessionId }),
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
  // Redirect the browser to the returned Stripe Checkout URL
  return data.url as string;
}
