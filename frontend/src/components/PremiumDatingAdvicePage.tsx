"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { fetchAdvice } from "../lib/advice";

type Msg = { id: string; role: "user" | "assistant"; text: string };

// Quick actions removed per request

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function PremiumDatingAdvicePage() {
  const [showModal, setShowModal] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "a1",
      role: "assistant",
      text: "Tell me what you want help with — paste the convo or describe the vibe.",
    },
    {
      id: "a2",
      role: "assistant",
      text: "Pick a mode (Dating advice or Rizz), then type what happened. I’ll tell you what to say next.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [mode, setMode] = useState<"dating_advice" | "rizz" | "strategy">("dating_advice");
  const [sessionId] = useState(() => (crypto as any).randomUUID());

  const canSend = useMemo(() => input.trim().length > 0, [input]);
  const placeholders = [
    "She said 'lol sure' — what does that mean?",
    'He hasn\'t replied in 2 days.',
    'How do I ask her out without sounding try-hard?',
    'Are we exclusive or not?',
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  useEffect(() => {
    if (input.trim().length > 0) return;
    const id = setInterval(() => setPlaceholderIndex((i) => (i + 1) % placeholders.length), 3200);
    return () => clearInterval(id);
  }, [input]);
  const placeholderText = input.trim().length > 0 ? '' : placeholders[placeholderIndex];
  function scrollToBottom() {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  function formatAdviceToText(result: any) {
    // Prefer server-provided single-message response
    if (typeof result?.message === "string" && result.message.trim().length > 0) {
      return result.message;
    }

    // Fallback: stringify minimal parts if message absent
    const headline = result?.strategy?.headline ? `${result.strategy.headline}\n` : "";
    const why = result?.strategy?.why ? `${result.strategy.why}\n` : "";
    const pick = result?.replies?.confident?.[0] || result?.replies?.playful?.[0] || result?.replies?.sweet?.[0] || "";
    return `${headline}${why}${pick}`.trim();
  }

  async function pushUser(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const conversation = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-12)
        .map((m) => ({ from: m.role === "user" ? "me" : "them", text: m.text }));

      const result = await fetchAdvice({
        situation: "General dating conversation",
        goal: "Get the best next message + plan",
        tone: "confident and smooth",
        conversation,
        userMessage: trimmed,
        mode,
        sessionId,
      });

      const assistantText = formatAdviceToText(result);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: assistantText || "I generated advice, but it returned empty.",
        },
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", text: `Error: ${e.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function pushStrategy(text: string) {
    const trimmed = (text || "").trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const conversation = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-12)
        .map((m) => ({ from: m.role === "user" ? "me" : "them", text: m.text }));

      const result = await fetchAdvice({
        situation: "Quick strategist analysis",
        goal: "Fast verdict + next move",
        tone: "direct and strategic",
        conversation,
        userMessage: trimmed,
        mode: "strategy",
        sessionId,
      });

      const assistantText = formatAdviceToText(result);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: assistantText || "I generated advice, but it returned empty.",
        },
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", text: `Error: ${e.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen app-bg">
      {/* Top Nav */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/30 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-linear-to-br from-zinc-950 to-zinc-700 text-white grid place-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M12 21s-7-4.35-9.2-7.05C-0.1 8.3 5.2 3 8.7 5.6 10.3 6.9 12 9 12 9s1.7-2.1 3.3-3.4C18.8 3 24.1 8.3 21.2 13.95 19 17.65 12 21 12 21z" />
              </svg>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold gradient-text">Sparkd</div>
              <div className="text-xs text-zinc-500">Modern dating coach</div>
            </div>
          </div>

            <div className="flex items-center gap-2">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Good
            </span>
            <span className="text-sm text-zinc-500">7.4/10</span>
            <button className="ml-2 btn btn-primary" onClick={() => setShowModal(true)}>
              Upgrade
            </button>
            <button className="ml-2 btn btn-ghost">
              Sign in
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
        <main className="mx-auto max-w-6xl px-4 py-8 relative">
          <div className="hearts-decor" />
        {/* HeroCard removed */}

        {/* Main layout */}
        <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Chat panel */}
          <div className="rounded-3xl border border-zinc-200 bg-white shadow-deep overflow-hidden">
            {/* Chat header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-linear-to-br from-zinc-950 to-zinc-700 text-white grid place-items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 2v3" />
                    <path d="M12 19v3" />
                    <path d="M4.2 4.2L6 6" />
                    <path d="M18 18l1.8 1.8" />
                    <path d="M2 12h3" />
                    <path d="M19 12h3" />
                    <path d="M4.2 19.8L6 18" />
                    <path d="M18 6l1.8-1.8" />
                    <path d="M12 7a5 5 0 100 10 5 5 0 000-10z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold">Spark</div>
                  <div className="text-xs text-zinc-500">iMessage-style advice</div>
                </div>
              </div>
              <div className="text-xs text-zinc-500">Online</div>
            </div>

            {/* Messages */}
            <div
              ref={listRef}
              className="h-[56vh] overflow-y-auto px-4 py-4"
            >
              <div className="space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={cx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={cx("max-w-[85%] rounded-3xl px-4 py-3 text-[15px] leading-relaxed shadow-sm whitespace-pre-line", m.role === "user" ? "user-bubble" : "assistant-bubble")}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions removed */}

            {/* Composer */}
            <div className="border-t border-zinc-100 bg-white px-4 py-4">
              <div className="flex items-end gap-2">
                <div className="flex-1 composer-input">
                  <div className="mb-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setMode("dating_advice")}
                        className={`px-3 py-1.5 rounded-full text-sm border transition ${mode === "dating_advice" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}
                      >
                        Dating advice
                      </button>

                      <button
                        onClick={() => setMode("rizz")}
                        className={`px-3 py-1.5 rounded-full text-sm border transition ${mode === "rizz" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}
                      >
                        Rizz
                      </button>
                      <button
                        onClick={() => setMode("strategy")}
                        className={`px-3 py-1.5 rounded-full text-sm border transition ${mode === "strategy" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}
                      >
                        Strategy
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your situation… (paste the convo, what they said, and what you want)"
                    rows={1}
                    className="max-h-28 w-full resize-none placeholder:text-zinc-400"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (canSend) pushUser(input);
                      }
                    }}
                  />
                  <div className="composer-meta">
                    <div>Enter to send • Shift+Enter new line</div>
                    <div>Privacy-first (UI placeholder)</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => pushUser(input)}
                  disabled={!input.trim() || loading}
                  aria-label="Send message"
                  className={cx(
                    "send-button",
                    !input.trim() || loading ? "bg-zinc-200 text-zinc-400 cursor-not-allowed" : "accent-gradient"
                  )}
                >
                  {loading ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10v6a2 2 0 0 1-2 2h-6"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7-4.35-9.2-7.05C-0.1 8.3 5.2 3 8.7 5.6 10.3 6.9 12 9 12 9s1.7-2.1 3.3-3.4C18.8 3 24.1 8.3 21.2 13.95 19 17.65 12 21 12 21z"/></svg>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Quick Analyze: run strategist on current input or last user message
                    const text = input.trim() || messages.slice().reverse().find(m => m.role === 'user')?.text || '';
                    if (text) pushStrategy(text);
                  }}
                  disabled={loading}
                  className="ml-2 rounded-full px-3 py-1.5 text-sm border bg-white text-gray-700 hover:bg-gray-50"
                >
                  Quick Analyze
                </button>
              </div>
            </div>
          </div>

          {/* Side panel: show only after conversation is finished */}
          {showInsights ? (
            <aside className="space-y-6">
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-deep">
                <div className="text-sm font-semibold">Conversation Insights</div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-4xl font-semibold">7.4</div>
                  <div className="text-right">
                    <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Good
                    </div>
                    <div className="mt-2 text-sm text-zinc-600">Playful</div>
                  </div>
                </div>

                <div className="mt-5 space-y-2 text-sm text-zinc-600">
                  <div className="flex items-center justify-between">
                    <span>Clarity</span>
                    <span className="text-zinc-500">Good</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Confidence</span>
                    <span className="text-zinc-500">Medium</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Momentum</span>
                    <span className="text-zinc-500">High</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-deep">
                <div className="text-sm font-semibold">Suggested Replies</div>
                <div className="mt-4 grid gap-2">
                  {['😄', '😉', '❤️', '🔥'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => pushUser(`Use this vibe: ${emoji}`)}
                      className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm shadow-sm hover:bg-zinc-50"
                    >
                      {emoji} Make it match this vibe
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          ) : (
            <aside className="space-y-6">
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-deep">
                <div className="text-sm font-semibold">Conversation in progress</div>
                <p className="mt-3 text-sm text-zinc-600">Finish the conversation to see insights and suggested replies.</p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setShowInsights(true)}
                    className="w-full rounded-2xl bg-zinc-950 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
                  >
                    Finish conversation
                  </button>
                </div>
              </div>
            </aside>
          )}
        </section>

        {/* Premium modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
            <div className="relative z-10 w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold">Premium</div>
                  <div className="mt-1 text-xs text-zinc-500">Best for daily texting</div>
                </div>
                <button className="text-zinc-500" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <div className="mt-4 text-3xl font-semibold">
                $19<span className="text-base font-medium text-zinc-400">/mo</span>
              </div>

              <ul className="mt-5 space-y-2 text-sm text-zinc-600">
                <li>• Unlimited replies + rewrites</li>
                <li>• Tone + intent detection</li>
                <li>• “Make it smoother” slider</li>
                <li>• Date plan + follow-up texts</li>
              </ul>

              <button
                type="button"
                className="mt-6 w-full rounded-2xl bg-zinc-950 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
                onClick={() => {
                  // placeholder for upgrade action
                  setShowModal(false);
                }}
              >
                Upgrade to Premium
              </button>

              <div className="mt-3 text-xs text-zinc-400">Backend later: this will start checkout.</div>
            </div>
          </div>
        )}

        <footer className="mt-10 text-center text-xs text-zinc-400">
          © {new Date().getFullYear()} Sparkd • Premium UI (backend coming next)
        </footer>
      </main>
    </div>
  );
}
