"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ollamaChat = ollamaChat;
async function ollamaChat(opts) {
    const { model, messages, system, user, temperature = 0.7 } = opts;
    const msgs = Array.isArray(messages)
        ? messages
        : [
            { role: "system", content: system ?? "" },
            { role: "user", content: user ?? "" },
        ];
    const body = {
        model,
        messages: msgs,
        temperature,
        stream: false,
    };
    if (typeof opts.maxTokens === "number")
        body.max_tokens = opts.maxTokens;
    const r = await fetch(process.env.OLLAMA_URL || "http://localhost:11434/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!r.ok) {
        const text = await r.text();
        throw new Error(`Ollama error: ${r.status} ${text}`);
    }
    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content ??
        data?.choices?.[0]?.message ??
        data?.response ??
        "";
    return (typeof content === "string" ? content : String(content)).trim();
}
