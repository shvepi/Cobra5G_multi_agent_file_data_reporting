"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriberNotifyShouldRetryError = exports.SubscriberNotifyError = exports.ErrorResponse = void 0;
class ErrorResponse extends Error {
    constructor(error, code) {
        super();
        this.error = error;
        this.code = code;
    }
    toString() {
        return "b";
    }
}
exports.ErrorResponse = ErrorResponse;
class SubscriberNotifyError extends Error {
    constructor(code) {
        super();
        this.code = code;
    }
    toString() {
        return "SubscriberNotifyError";
    }
}
exports.SubscriberNotifyError = SubscriberNotifyError;
class SubscriberNotifyShouldRetryError extends Error {
    constructor(code) {
        super();
        this.code = code;
    }
    toString() {
        return "SubscriberNotifyError";
    }
}
exports.SubscriberNotifyShouldRetryError = SubscriberNotifyShouldRetryError;
