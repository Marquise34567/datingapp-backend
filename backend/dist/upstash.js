"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
exports.setPaid = setPaid;
exports.isPaid = isPaid;
exports.isoWeekKey = isoWeekKey;
exports.unsetPaid = unsetPaid;
exports.consumeWeekly = consumeWeekly;
exports.getWeeklyUsage = getWeeklyUsage;
exports.incrementWeeklyUsage = incrementWeeklyUsage;
exports.markTokenPaid = markTokenPaid;
exports.isTokenPaid = isTokenPaid;
const redis_1 = require("@upstash/redis");
// Initialize from environment as requested
exports.redis = redis_1.Redis.fromEnv();
function isoWeekKey(d = new Date()) {
    const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${tmp.getUTCFullYear()}-${String(weekNo).padStart(2, '0')}`;
}
async function setPaid(tokenKey) {
    try {
        await exports.redis.set(`paid:${tokenKey}`, '1');
        await exports.redis.expire(`paid:${tokenKey}`, 60 * 60 * 24 * 365);
        return true;
    }
    catch (e) {
        console.warn('setPaid failed', e);
        return false;
    }
}
async function isPaid(tokenKey) {
    try {
        const v = await exports.redis.get(`paid:${tokenKey}`);
        return String(v) === '1';
    }
    catch (e) {
        console.warn('isPaid failed', e);
        return false;
    }
}
async function unsetPaid(tokenKey) {
    try {
        await exports.redis.del(`paid:${tokenKey}`);
        return true;
    }
    catch (e) {
        console.warn('unsetPaid failed', e);
        return false;
    }
}
async function consumeWeekly(tokenKey, limit = 3) {
    try {
        const week = isoWeekKey();
        const k = `usage:${tokenKey}:${week}`;
        // increment
        const usedRaw = await exports.redis.incr(k);
        const used = Number(usedRaw ?? 0);
        if (used === 1) {
            try {
                await exports.redis.expire(k, 60 * 60 * 24 * 8);
            }
            catch (e) {
                // ignore
            }
        }
        const allowed = used <= limit;
        const remaining = Math.max(0, limit - used);
        return { used, remaining, allowed };
    }
    catch (e) {
        console.warn('consumeWeekly failed', e);
        return { used: 0, remaining: 0, allowed: false };
    }
}
// Keep existing-compatible helpers for other modules in the repo
async function getWeeklyUsage(tokenKey) {
    try {
        const week = isoWeekKey();
        const k = `usage:${tokenKey}:${week}`;
        const v = await exports.redis.get(k);
        return Number(v ?? 0);
    }
    catch (e) {
        console.warn('getWeeklyUsage failed', e);
        return null;
    }
}
async function incrementWeeklyUsage(tokenKey, by = 1) {
    try {
        const week = isoWeekKey();
        const k = `usage:${tokenKey}:${week}`;
        // prefer incrby if available
        const n = typeof exports.redis.incrby === 'function' ? await exports.redis.incrby(k, by) : await exports.redis.incr(k);
        try {
            await exports.redis.expire(k, 60 * 60 * 24 * 30);
        }
        catch (e) {
            // ignore
        }
        return Number(n ?? 0);
    }
    catch (e) {
        console.warn('incrementWeeklyUsage failed', e);
        return null;
    }
}
async function markTokenPaid(tokenKey) {
    return setPaid(tokenKey);
}
async function isTokenPaid(tokenKey) {
    return isPaid(tokenKey);
}
exports.default = exports.redis;
