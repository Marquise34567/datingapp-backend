export async function createCheckoutSession(sessionId?: string) {
  const res = await fetch(`/api/billing/create-checkout-session`, {
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
  return data.url as string;
}
