"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const multer_1 = __importDefault(require("multer"));
const advice_1 = require("./routes/advice");
const entitlements_1 = require("./entitlements");
const upstash_1 = __importStar(require("./upstash"));
const googleSheets_1 = require("./googleSheets");
const googleapis_1 = require("googleapis");
// --- Google Sheets helper ---
function getGoogleAuth() {
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");
    return new googleapis_1.google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
}
async function appendTestRow() {
    const auth = getGoogleAuth();
    const sheets = googleapis_1.google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const tab = process.env.GOOGLE_SHEET_TAB || 'Sheet1';
    const now = new Date().toISOString();
    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${tab}!A:E`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [[`test_${Date.now()}`, 'test@example.com', 'cus_TEST', 'cs_TEST', now]],
        },
    });
}
// Ollama config
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const OLLAMA_VISION_MODEL = process.env.OLLAMA_VISION_MODEL || 'llama3.2-vision';
// Free daily limit (default 5)
const FREE_DAILY_LIMIT = Number(process.env.FREE_DAILY_LIMIT || 5);
function secondsUntilMidnightLocal() {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    return Math.max(60, Math.floor((midnight.getTime() - now.getTime()) / 1000));
}
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
async function callOllamaChat(body) {
    const url = `${OLLAMA_URL.replace(/\/$/, '')}/api/chat`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal });
        if (!res.ok) {
            const txt = await res.text().catch(() => '<no body>');
            throw new Error(`Ollama /api/chat failed ${res.status}: ${txt}`);
        }
        return res.json();
    }
    catch (err) {
        const msg = (err && err.name === 'AbortError') ? 'Ollama request timed out' : `Ollama connection failed: ${err && err.message ? err.message : String(err)}`;
        const e = new Error(msg);
        e.code = 'OLLAMA_CONNECTION_FAILED';
        throw e;
    }
    finally {
        clearTimeout(timeout);
    }
}
async function callOllamaGenerate(body) {
    const url = `${OLLAMA_URL.replace(/\/$/, '')}/api/generate`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal });
        if (!res.ok) {
            const txt = await res.text().catch(() => '<no body>');
            throw new Error(`Ollama /api/generate failed ${res.status}: ${txt}`);
        }
        return res.json();
    }
    catch (err) {
        const msg = (err && err.name === 'AbortError') ? 'Ollama request timed out' : `Ollama connection failed: ${err && err.message ? err.message : String(err)}`;
        const e = new Error(msg);
        e.code = 'OLLAMA_CONNECTION_FAILED';
        throw e;
    }
    finally {
        clearTimeout(timeout);
    }
}
function extractTextFromOllamaResponse(resp) {
    try {
        // Flexible extraction depending on response shape
        if (!resp)
            return '';
        // common shapes: { choices: [{ message: { content: '...' } }] } or { choices: [{ content: '...' }] }
        if (Array.isArray(resp.choices) && resp.choices.length) {
            const c = resp.choices[0];
            if (c.message && (c.message.content || c.message)) {
                return typeof c.message.content === 'string' ? c.message.content : (c.message.content ?? JSON.stringify(c.message));
            }
            if (c.content)
                return typeof c.content === 'string' ? c.content : JSON.stringify(c.content);
            // some models embed text in c.text or c.output
            if (c.text)
                return String(c.text);
            if (c.output)
                return typeof c.output === 'string' ? c.output : JSON.stringify(c.output);
        }
        // fallbacks: resp.output, resp.text
        if (resp.output)
            return typeof resp.output === 'string' ? resp.output : JSON.stringify(resp.output);
        if (resp.text)
            return String(resp.text);
        return JSON.stringify(resp);
    }
    catch (e) {
        return '';
    }
}
// Helper that calls Ollama (chat then generate fallback) and returns only a plain-text reply
async function fetchOllamaReply(body) {
    try {
        let resp;
        try {
            resp = await callOllamaChat(body);
        }
        catch (e) {
            resp = await callOllamaGenerate(body);
        }
        const reply = (resp && resp.message && (typeof resp.message.content === 'string' ? resp.message.content : resp.message.content ?? '')) || extractTextFromOllamaResponse(resp) || '';
        return { reply: String(reply), raw: resp };
    }
    catch (err) {
        throw err;
    }
}
const app = (0, express_1.default)();
// Trust proxy so secure cookies work behind tunnels/proxies
app.set('trust proxy', 1);
// BACKEND (Express)
const allowedOrigins = new Set([
    "http://localhost:3000",
    "http://localhost:3001",
    "https://sparkdd.live",
    "https://www.sparkdd.live",
    // add your Vercel preview domains if you use them:
    // "https://your-vercel-app.vercel.app",
    // Vite dev server local origins
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]);
const corsOptions = {
    origin: (origin, callback) => {
        // allow non-browser requests (curl/postman) that have no origin
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.has(origin))
            return callback(null, true);
        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
};
app.use((0, cors_1.default)(corsOptions));
app.use((0, cookie_parser_1.default)());
// Important: Stripe webhook needs the raw body. Register the raw parser
// route before the JSON body parser middleware so the raw payload is available.
app.post('/api/webhook/stripe', express_1.default.raw({ type: 'application/json' }), async (req, res) => {
    const sig = (req.headers['stripe-signature'] || '');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret)
        return res.status(400).json({ ok: false, error: 'webhook not configured' });
    try {
        const Stripe = require('stripe');
        const stripeSecretEnv = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET;
        const stripe = new Stripe(String(stripeSecretEnv), { apiVersion: '2022-11-15' });
        const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const token = session.client_reference_id || (session.metadata && session.metadata.token) || session.metadata?.token;
            const uid = token || session.client_reference_id || (session.metadata && session.metadata.sessionId) || session.metadata?.uid;
            const customer = session.customer;
            if (uid) {
                try {
                    (0, entitlements_1.setPremium)(uid, true, 'premium');
                }
                catch (e) {
                    console.warn('failed to set premium from webhook', e);
                }
            }
            // mark token paid in Upstash and append to Google Sheet
            try {
                if (token) {
                    await (0, upstash_1.markTokenPaid)(String(token));
                    try {
                        // also set premium flag for the user id used as client_reference_id
                        await upstash_1.default.set(`user:${String(token)}:premium`, 'true');
                        // keep this key long lived
                        try {
                            await upstash_1.default.expire(`user:${String(token)}:premium`, 60 * 60 * 24 * 365);
                        }
                        catch (e) { /* ignore */ }
                    }
                    catch (e) {
                        console.warn('failed to set user premium flag in redis', e);
                    }
                    const subs = session.subscription;
                    const subscriptionId = subs && subs.id ? subs.id : session.subscription || null;
                    const customerId = String(customer || '');
                    const ts = new Date().toISOString();
                    await (0, googleSheets_1.appendPurchaseRow)([String(token), String(event.id || ''), customerId, String(subscriptionId || ''), ts]);
                }
            }
            catch (e) {
                console.warn('failed to mark token paid or append sheet', e);
            }
            if (customer && uid) {
                try {
                    const subs = session.subscription;
... (file truncated for brevity)
