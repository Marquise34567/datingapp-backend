import { getHistory, pushTurn } from "./memoryStore.js";
import { ollamaChat } from "./llmOllama.js";

type Mode = "dating_advice" | "rizz" | "strategy";
type Intent =
  | "greeting"
  | "no_reply"
  | "ask_out"
  | "reply_help"
  | "define"
  | "conflict"
  | "breakup"
  | "apology"
  | "flirt"
  | "general";

function norm(s = "") {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}
function hasAny(t: string, words: string[]) {
  return words.some((w) => t.includes(w));
}
function rand<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function clamp(s: string, max = 520) {
  const x = s.trim();
  return x.length > max ? x.slice(0, max - 1).trim() + "…" : x;
}

function detectIntent(tRaw: string): Intent {
  const t = norm(tRaw || "");
  if (!t) return "general";
  if (hasAny(t, ["hi", "hey", "yo", "hello", "wyd", "sup"])) return "greeting";
  if (hasAny(t, ["ghost", "left on read", "not replying", "dry", "ignoring", "not texting"])) return "no_reply";
  if (hasAny(t, ["ask her out", "ask him out", "date", "link", "hang", "pull up", "meet up"])) return "ask_out";
  if (hasAny(t, ["what do i say", "what should i text", "how do i reply", "what do i text back", "respond"])) return "reply_help";
  if (hasAny(t, ["what are we", "exclusive", "situationship", "relationship", "serious"])) return "define";
  if (hasAny(t, ["argue", "fight", "mad", "upset", "disrespect", "attitude"])) return "conflict";
  if (hasAny(t, ["broke up", "left me", "dumped", "breakup", "ended it"])) return "breakup";
  if (hasAny(t, ["sorry", "apologize", "my fault"])) return "apology";
  if (hasAny(t, ["flirt", "rizz", "smooth", "compliment", "game"])) return "flirt";
  return "general";
}

function coachStyle(mode: Mode) {
  if (mode === "rizz") return { openers: ["Say less 😌", "Bet — keep it smooth.", "Aight, short and bold."], vibeWords: ["smooth", "confident"] };
  return { openers: ["Got you.", "Okay — I hear you.", "That’s real."], vibeWords: ["calm", "direct"] };
}

function buildQuickReplies(mode: Mode, intent: string) {
  const dating: Record<string, string[]> = {
    greeting: ["What’s the situation?", "Talk to me — what happened?"],
    no_reply: ["Send: ‘All good — you still down to link this week?’", "Send: ‘You been busy? When you free this week?’"],
    ask_out: ["Send: ‘You free Thu or Sat?’", "Send: ‘Coffee this week?’"],
    reply_help: ["Send me what they said + what you want, I’ll write the exact reply."],
    define: ["Send: ‘I like you — are we building or keeping it casual?’"],
    conflict: ["Keep it short: ‘I don’t want to argue over text. Let’s talk later.’"],
    breakup: ["Protect your peace. Don’t send a novel."],
    apology: ["Acknowledge, take responsibility, and move forward."],
    flirt: ["Send: ‘You got a vibe. When you free?’"],
    general: ["Tell me one sentence — I’ll tell you what to text.", "What’s the goal: date, clarity, or move on?"],
  };
  const rizz = { ...dating };
  return mode === "rizz" ? rizz[intent] || rizz.general : dating[intent] || dating.general;
}

function historyText(sessionId: string) {
  return getHistory(sessionId).map((x) => `${x.role}:${x.text}`).join("\n");
}

function alreadyAsked(h: string, marker: string) {
  return h.includes(marker);
}

type CoachReply = { message?: string; reply?: string; text?: string; advice?: string; error?: string };

function extractMessage(data: unknown): string {
  if (!data) return "";
  if (typeof data === "string") return data;
  const d = data as any;
  return d.message ?? d.reply ?? d.text ?? d.advice ?? (d.error ? `Error: ${d.error}` : "");
}

async function llmAssist(opts: { mode: Mode; userMessage: string; sessionId: string; intent: Intent }) {
  const { mode, userMessage, sessionId, intent } = opts;
  const h = getHistory(sessionId).slice(-12);
  const transcript = h.map((x) => `${x.role === "user" ? "USER" : "COACH"}: ${x.text}`).join("\n");

  const strategySystem = `You are Spark — a top-tier, human-like dating coach and relationship strategist. Behave like a real coach: warm, confident, direct, and decisive. Never say "As an AI" or similar. Do NOT output JSON. Follow this coach response frame:

- Validate: 1–2 lines of empathy/understanding (specific).
- Read the room: 1–3 possible meanings of the situation.
- Clear next step: one concrete action the user should take now.
- Words to say: 2–4 short message options labeled by tone.
- Ask at most one targeted clarifying question, only if needed.

For `strategy` mode: focus on big-picture assessment, quick verdict, timeline, and one prioritized next move. Output short paragraphs and bullets, 6–12 lines total. No fluff.`;

  const coachSystem = `You are Spark — a top-tier, human-like dating coach and relationship strategist. Behave like a real coach: warm, confident, direct, and decisive. Never say "As an AI" or similar. Do NOT output JSON. Follow this coach response frame:

- Validate: 1–2 lines of empathy/understanding (specific).
- Read the room: 1–3 likely interpretations.
- Clear next step: one concrete action.
- Words to say: 2–5 message options with tone labels.
- Ask at most one clarifying question if needed.

Match the user's vibe. For `rizz` mode prioritize playful, confident, flirt-forward lines; for `dating` mode prioritize emotionally intelligent, respectful wording. Keep replies short, modern, and human. Default length 6–12 lines.`;

  const system = mode === "strategy" ? strategySystem : coachSystem;

  // Build chat messages: system, conversation history (user/assistant), final user instruction
  const historyMessages = h.map((turn) => ({
    role: turn.role === "user" ? "user" : "assistant",
    content: String(turn.text || ""),
  }));

  const finalUserContent = `Mode: ${mode}\n\nLatest user message:\n${userMessage}\n\nPlease reply as the coach to the latest user message. Use empathy, give a clear next step, provide 2-3 short message options labeled by tone, and ask at most one clarifying question if needed. Output plain natural language only.`;

  const messages = [
    { role: "system", content: system },
    ...historyMessages,
    { role: "user", content: finalUserContent },
  ];

  const model = process.env.OLLAMA_MODEL || "llama3.1";
  const raw = await ollamaChat({ model, messages, temperature: 0.25 });
  return raw as unknown;
}

export async function coachBrainV2(body: { sessionId: string; userMessage: string; mode?: Mode }): Promise<{ message: string }> {
  const sessionId = body.sessionId;
  const mode: Mode = body.mode === "rizz" ? "rizz" : body.mode === "strategy" ? "strategy" : "dating_advice";
  const msg = (body.userMessage || "").trim();
  const intent = detectIntent(msg);
  const style = coachStyle(mode);
  const hText = historyText(sessionId);

  const useLLM = process.env.USE_OLLAMA === "true";

  let reply = "";

  if (useLLM) {
    try {
      const raw = await llmAssist({ mode, userMessage: msg, sessionId, intent });
      reply = extractMessage(raw) || "";
      if (reply) reply = reply.split(/\n{2,}/).map((s) => s.trim()).join("\n\n");
    } catch (err) {
      console.warn("llmAssist error:", (err as any)?.message || err);
      reply = "";
    }
  }

  if (!reply) {
    const options = buildQuickReplies(mode, intent);
    const askedForLastMessage = alreadyAsked(hText, "Drop the last message") || alreadyAsked(hText, "Send me what they said") || alreadyAsked(hText, "What did they say last");

    if (intent === "reply_help" && askedForLastMessage) {
      reply = mode === "rizz" ? `${rand(style.openers)}\n\nSend: “I’m down — when you free this week?”` : `${rand(style.openers)}\n\nSend: “I’m down — what day works for you this week?”`;
    } else {
      reply = `${rand(style.openers)}\n\n${rand(options)}`;
    }

    if (!askedForLastMessage && intent === "no_reply" && !alreadyAsked(hText, "How long has it been")) {
      reply += `\n\nHow long has it been since they last replied?`;
    }
  }

  const out = clamp(reply || "");
  if (!out) return { message: "Sorry, I couldn't generate a reply right now." };
  return { message: out };
}
