export type AdviceResponse = {
  message?: string;
  insights?: any;
  strategy?: { headline?: string; why?: string; do?: string[]; dont?: string[] };
  replies?: Record<string, string[]>;
  datePlan?: any;
};

export async function fetchAdvice(payload: any): Promise<AdviceResponse> {
  // Try to call the backend at the relative `/api/advice` endpoint.
  // If the network request fails (no backend running), fall back to a mock response.
  // If the backend responds with a non-2xx status, rethrow the structured error
  // so the UI can react (e.g. DAILY_LIMIT 429).
  try {
    // Normalize fields the backend accepts (message / text / input)
    const rawMode = payload?.mode ?? payload?.tab;
    const normalizedMode = rawMode === 'dating_advice' ? 'dating' : rawMode;

    // send `text` consistently so backend validation sees it
    const body = {
      text: payload?.message ?? payload?.text ?? payload?.userMessage ?? payload?.input ?? '',
      mode: normalizedMode,
      conversation: payload?.conversation,
      sessionId: payload?.sessionId,
      situation: payload?.situation,
      goal: payload?.goal,
      tone: payload?.tone,
    };

    const res = await fetch(`/api/advice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      data = { raw: text };
    }

    if (!res.ok) {
      throw { status: res.status, body: data, raw: text };
    }

    return data as AdviceResponse;
  } catch (err: any) {
    // Network error or fetch failed — provide a local mock so the app still works offline.
    await new Promise((r) => setTimeout(r, 700));
    const userMessage = payload?.userMessage || '(no input)';

    return {
      message: `Suggested reply for: ${userMessage}\n\nKeep it confident, brief, and friendly.`,
      strategy: {
        headline: 'Quick plan',
        why: 'This reply keeps momentum while sounding casual.',
      },
      replies: {
        confident: [`${userMessage} — sounds great. When are you free?`],
        playful: [`${userMessage} 😄 Let’s do this — when works for you?`],
        sweet: [`${userMessage} ❤️ Would love to see you — what about Friday?`],
      },
    };
  }
}
