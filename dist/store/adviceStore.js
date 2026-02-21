"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllAdvice = getAllAdvice;
exports.addAdvice = addAdvice;
const store = [];
function getAllAdvice() {
    return store;
}
function addAdvice(data) {
    const advice = {
        id: generateId(),
        createdAt: new Date().toISOString(),
        ...data
    };
    store.push(advice);
    return advice;
}
function generateId() {
    return Math.random().toString(36).slice(2, 9);
}
