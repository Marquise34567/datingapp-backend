"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCoach = runCoach;
const llmOllama_1 = require("./llmOllama");
const coachRouter_1 = require("./coachRouter");
const coachPrompts_1 = require("./coachPrompts");
const memoryStore_1 = require("./memoryStore");
async function runCoach(opts) {
    const mode = (0, coachRouter_1.classify)(opts.userMessage || '', opts.explicitMode);
    const sessionMem = (0, memoryStore_1.getSessionMemory)(opts.sessionId || '') || {};
    const memorySummary = Object.keys(sessionMem).length ? Object.entries(sessionMem).map(([k, v]) => `${k}:${String(v)}`).join('\n') : '';
    const system = (0, coachPrompts_1.buildSystemPrompt)(mode);
    const user = (0, coachPrompts_1.buildUserPrompt)(opts.userMessage || '', memorySummary);
    const model = opts.model || process.env.OLLAMA_MODEL || 'gemma3:4b';
    const temperature = opts.advanced ? 0.9 : 0.8;
    const maxTokens = opts.advanced ? 1024 : 512;
    const messages = [
        { role: 'system', content: system },
        { role: 'user', content: user },
    ];
    const raw = await (0, llmOllama_1.ollamaChat)({ model, messages, temperature, maxTokens });
    // Try to parse JSON; if not JSON, return raw text under `message`
    let parsed = null;
    try {
        parsed = JSON.parse(raw);
    }
    catch (e) {
        // ignore
    }
    // Update session memory summary cheaply
    try {
        const prev = sessionMem?.whatHappened ? String(sessionMem.whatHappened) : '';
        const next = (prev + '\n' + (opts.userMessage || '')).slice(-1000);
        (0, memoryStore_1.setSessionMemory)(opts.sessionId || '', { whatHappened: next });
    }
    catch (e) {
        // ignore
    }
    return { raw, parsed };
}
exports.default = runCoach;
