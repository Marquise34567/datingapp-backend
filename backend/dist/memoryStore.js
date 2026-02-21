"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSessionMemory = setSessionMemory;
exports.getSessionMemory = getSessionMemory;
exports.getHistory = getHistory;
exports.pushTurn = pushTurn;
exports.getLastCoachLine = getLastCoachLine;
const store = new Map();
const metaStore = new Map();
function setSessionMemory(sessionId, partial) {
    const prev = metaStore.get(sessionId) || {};
    const next = { ...prev, ...partial };
    metaStore.set(sessionId, next);
    return next;
}
function getSessionMemory(sessionId) {
    return metaStore.get(sessionId) || {};
}
function getHistory(sessionId) {
    return store.get(sessionId) || [];
}
function pushTurn(sessionId, turn, max = 10) {
    const arr = store.get(sessionId) || [];
    arr.push(turn);
    const trimmed = arr.slice(-max);
    store.set(sessionId, trimmed);
    return trimmed;
}
function getLastCoachLine(sessionId) {
    const arr = getHistory(sessionId);
    for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i].role === "coach")
            return arr[i].text;
    }
    return "";
}
