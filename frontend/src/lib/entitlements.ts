export type Entitlements = {
  ok: boolean;
  plan: string | null;
  isPremium: boolean;
  dailyLimit: number | null;
  dailyUsed: number;
  dailyRemaining: number | null;
  advanced: boolean;
};

export async function fetchEntitlements(sessionId?: string): Promise<Entitlements> {
  const API_URL = import.meta.env.VITE_API_URL;
  if (!API_URL) return { ok: true, plan: 'free', isPremium: false, dailyLimit: 3, dailyUsed: 0, dailyRemaining: 3, advanced: false } as Entitlements;
  const url = new URL(`${API_URL}/api/me/entitlements`);
  if (sessionId) url.searchParams.set('sessionId', sessionId);
  const res = await fetch(url.toString(), { method: 'GET' });
  const text = await res.text();
  try {
    const data = text ? JSON.parse(text) : {};
    return data as Entitlements;
  } catch (e) {
    return { ok: false, plan: null, isPremium: false, dailyLimit: 3, dailyUsed: 0, dailyRemaining: 3, advanced: false };
  }
}
