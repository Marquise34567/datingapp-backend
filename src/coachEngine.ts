type Mode = "dating_advice" | "rizz";

function norm(s?: string) {
  return (s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function cap(s: string, n = 360) {
  const out = s.trim();
  return out.length > n ? out.slice(0, n - 1).trim() + "…" : out;
}

function pickMode(m?: string): Mode {
  return m === "rizz" ? "rizz" : "dating_advice";
}

function rand<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function hasAny(t: string, words: string[]) {
  return words.some(w => t.includes(w));
}

function detectIntent(t: string) {
  if (hasAny(t, ["hi", "hey", "yo", "hello", "wyd", "sup"])) return "greeting";
  if (hasAny(t, ["not texting", "not replying", "left on read", "ghost", "dry", "ignoring"])) return "no_reply";
  if (hasAny(t, ["ask her out", "ask him out", "date", "link", "hang", "pull up"])) return "ask_out";
  if (hasAny(t, ["argue", "fight", "mad", "upset", "disrespect"])) return "conflict";
  if (hasAny(t, ["cheat", "lying", "trust issue", "suspicious"])) return "trust";
  if (hasAny(t, ["what are we", "exclusive", "relationship", "situationship"])) return "define";
  if (hasAny(t, ["flirt", "rizz", "smooth", "pull", "game"])) return "rizz_help";
  if (hasAny(t, ["break up", "move on", "closure"])) return "breakup";
  return "general";
}

function empathy(mode: Mode, intent: string) {
  const soft = [
    "I feel you — that’s annoying.",
    "That’s frustrating, not gonna lie.",
    "Yeah… that can mess with your head.",
    "I get it. Let’s handle it clean.",
    "Okay — we can work with this."
  ];

  const rizz = [
    "Say less 😌",
    "Bet. We’re gonna play this smooth.",
    "Aight, we moving smart.",
    "Cool — we’ll keep it clean and confident.",
    "Got you. No overthinking."
  ];

  if (mode === "rizz") return rand(rizz);
  return rand(soft);
}

function makeTextToSend(mode: Mode, intent: string, t: string) {
  const confident = (s: string) => (mode === "rizz" ? s.replace("Are you", "You").replace("Do you want to", "You tryna") : s);

  switch (intent) {
    case "no_reply":
      return confident(
        rand([
          `“No worries — you been busy? If you’re still down, let’s pick a day.”`,
          `“All good. You still wanna link this week or should we rain-check?”`,
          `“You good? If you’re not feeling it, just say that — no hard feelings.”`
        ])
      );

    case "ask_out":
      return confident(
        rand([
          `“You seem cool. Let’s link this week — Thu or Sat?”`,
          `“I’m tryna see you. What day works for you this week?”`,
          `“Quick coffee or a drink — when you free?”`
        ])
      );

    case "conflict":
      return rand([
        `“I’m not trying to argue over text. Let’s talk when we’re calm and fix it.”`,
        `“I hear you. I want us good — can we reset and talk later?”`,
        `“I care, but I’m not doing disrespect. Let’s talk properly.”`
      ]);

    case "define":
      return confident(
        rand([
          `“I like you. Are we building something or keeping it casual?”`,
          `“What are we doing here — I just want clarity.”`,
          `“I’m feeling you. You on the same page?”`
        ])
      );

    case "trust":
      return rand([
        `“I need the truth. Is there anything I should know?”`,
        `“I’m not accusing — I’m asking. Can you be real with me?”`,
        `“Trust is big for me. Help me understand what’s going on.”`
      ]);

    case "breakup":
      return rand([
        `“I respect you, but this isn’t working for me. I’m stepping back.”`,
        `“I’ve thought about it — I need to move on. I wish you the best.”`,
        `“I can’t do the back-and-forth anymore. Take care.”`
      ]);

    case "rizz_help":
      return rand([
        `“You’re cute. What you got planned this week?”`,
        `“You got energy… I like that. When you free?”`,
        `“I’m not even gonna lie — I’d take you out. You down?”`
      ]);

    case "greeting":
      return rand([
        `“Hey you — what’s the vibe today?”`,
        `“Hey 😌 what you trying to do — text advice or date plan?”`,
        `“Yo — tell me what happened.”`
      ]);

    default:
      if (hasAny(t, ["him", "he"])) {
        return confident(`“Be real — are you still interested or should I fall back?”`);
      }
      if (hasAny(t, ["her", "she"])) {
        return confident(`“Be honest — are you still feeling this or nah?”`);
      }
      return confident(`“What’s the vibe between y’all right now — good, weird, or distant?”`);
  }
}

function followUp(intent: string) {
  const options: Record<string, string[]> = {
    no_reply: [
      "How long has it been since the last message?",
      "Was your last text a question or a statement?"
    ],
    ask_out: [
      "First link, or y’all already have history?",
      "What kind of date fits your vibe — chill or more dressy?"
    ],
    conflict: [
      "Do you want to fix it or are you done?",
      "What crossed the line for you?"
    ],
    define: [
      "If they say “casual,” are you okay with that?",
      "Do you want exclusivity soon or just clarity?"
    ],
    trust: [
      "Do you have proof or just a feeling?",
      "Has anything like this happened before?"
    ],
    breakup: [
      "Do you want closure, or just peace?",
      "Are you trying to stay friends or fully move on?"
    ],
    rizz_help: [
      "You trying to be playful or more serious?",
      "Do you want to text first or respond to them?"
    ],
    greeting: [
      "Quick: what’s happening?",
      "What do you want the outcome to be?"
    ],
    general: [
      "What’s the outcome you want?",
      "Give me the one detail that matters most."
    ]
  };

  return rand(options[intent] || options.general);
}

export function coachRespond(body: { userMessage: string; mode?: Mode }) {
  const mode = pickMode(body.mode);
  const t = norm(body.userMessage || "");
  const intent = detectIntent(t);

  const intro = empathy(mode, intent);
  const textToSend = makeTextToSend(mode, intent, t);
  const q = followUp(intent);

  const message =
    `${intro}\n\nTry this:\n${textToSend}\n\n${q}`;

  return { message: cap(message, 420) };
}
