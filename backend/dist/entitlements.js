"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.entitlementsStore = void 0;
exports.getEntitlements = getEntitlements;
exports.setPremium = setPremium;
exports.incrementSparkCount = incrementSparkCount;
exports.incrementConversationCount = incrementConversationCount;
exports.getDailyRemaining = getDailyRemaining;
exports.getWeeklyRemaining = getWeeklyRemaining;
exports.resetSparkDaily = resetSparkDaily;
exports.resetWeeklyConversations = resetWeeklyConversations;
exports.updateStripeInfo = updateStripeInfo;
const store = new Map();
function todayDate() {
    return new Date().toISOString().slice(0, 10);
}
function weekStartDate() {
    const d = new Date();
    const day = d.getUTCDay();
    // get Monday as start of week (if Sunday (0), go back 6 days)
    const diff = (day === 0 ? -6 : 1 - day);
    const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff));
    return monday.toISOString().slice(0, 10);
}
function getEntitlements(uid) {
    if (!uid)
        return null;
    let e = store.get(uid);
    if (!e) {
        e = { isPremium: false, plan: null, sparkDailyCount: 0, sparkDailyDate: todayDate(), conversationWeeklyCount: 0, conversationWeekStart: weekStartDate() };
        store.set(uid, e);
    }
    // reset daily if stale
    if (e.sparkDailyDate !== todayDate()) {
        e.sparkDailyDate = todayDate();
        e.sparkDailyCount = 0;
        store.set(uid, e);
    }
    // reset weekly if week start changed
    if ((e.conversationWeekStart || '') !== weekStartDate()) {
        e.conversationWeekStart = weekStartDate();
        e.conversationWeeklyCount = 0;
        store.set(uid, e);
    }
    return { ...e };
}
function setPremium(uid, isPremium, plan = null) {
    if (!uid)
        return null;
    const prev = store.get(uid) || { isPremium: false, plan: null, sparkDailyCount: 0, sparkDailyDate: todayDate(), conversationWeeklyCount: 0, conversationWeekStart: weekStartDate(), stripeCustomerId: null, stripeSubscriptionId: null, currentPeriodEnd: null };
    const next = { ...prev, isPremium, plan };
    store.set(uid, next);
    return { ...next };
}
function incrementSparkCount(uid, by = 1) {
    if (!uid)
        return null;
    const e = store.get(uid) || { isPremium: false, plan: null, sparkDailyCount: 0, sparkDailyDate: todayDate(), conversationWeeklyCount: 0, conversationWeekStart: weekStartDate(), stripeCustomerId: null, stripeSubscriptionId: null, currentPeriodEnd: null };
    if (e.sparkDailyDate !== todayDate()) {
        e.sparkDailyDate = todayDate();
        e.sparkDailyCount = 0;
    }
    e.sparkDailyCount += by;
    store.set(uid, e);
    return { ...e };
}
function incrementConversationCount(uid, by = 1) {
    if (!uid)
        return null;
    const e = store.get(uid) || { isPremium: false, plan: null, sparkDailyCount: 0, sparkDailyDate: todayDate(), conversationWeeklyCount: 0, conversationWeekStart: weekStartDate(), stripeCustomerId: null, stripeSubscriptionId: null, currentPeriodEnd: null };
    if ((e.conversationWeekStart || '') !== weekStartDate()) {
        e.conversationWeekStart = weekStartDate();
        e.conversationWeeklyCount = 0;
    }
    e.conversationWeeklyCount = (e.conversationWeeklyCount || 0) + by;
    store.set(uid, e);
    return { ...e };
}
function getDailyRemaining(uid) {
    const e = getEntitlements(uid);
    if (!e)
        return { dailyLimit: 3, dailyUsed: 0, dailyRemaining: 3 };
    const limit = e.isPremium ? Infinity : 3;
    const used = e.sparkDailyCount || 0;
    return { dailyLimit: limit, dailyUsed: used, dailyRemaining: limit === Infinity ? Infinity : Math.max(0, limit - used) };
}
function getWeeklyRemaining(uid) {
    const e = getEntitlements(uid);
    if (!e)
        return { weeklyLimit: 3, weeklyUsed: 0, weeklyRemaining: 3 };
    const limit = e.isPremium ? Infinity : 3;
    const used = e.conversationWeeklyCount || 0;
    return { weeklyLimit: limit, weeklyUsed: used, weeklyRemaining: limit === Infinity ? Infinity : Math.max(0, limit - used) };
}
function resetSparkDaily(uid) {
    const e = store.get(uid);
    if (!e)
        return null;
    e.sparkDailyDate = todayDate();
    e.sparkDailyCount = 0;
    store.set(uid, e);
    return { ...e };
}
function resetWeeklyConversations(uid) {
    const e = store.get(uid);
    if (!e)
        return null;
    e.conversationWeekStart = weekStartDate();
    e.conversationWeeklyCount = 0;
    store.set(uid, e);
    return { ...e };
}
function updateStripeInfo(uid, opts) {
    if (!uid)
        return null;
    const e = store.get(uid) || { isPremium: false, plan: null, sparkDailyCount: 0, sparkDailyDate: todayDate(), stripeCustomerId: null, stripeSubscriptionId: null, currentPeriodEnd: null };
    if (opts.customerId !== undefined)
        e.stripeCustomerId = opts.customerId;
    if (opts.subscriptionId !== undefined)
        e.stripeSubscriptionId = opts.subscriptionId;
    if (opts.currentPeriodEnd !== undefined)
        e.currentPeriodEnd = opts.currentPeriodEnd;
    store.set(uid, e);
    return { ...e };
}
// Expose store for potential DB swap
exports.entitlementsStore = store;
