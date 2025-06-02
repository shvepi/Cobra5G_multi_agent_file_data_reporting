"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TimeoutManager {
    constructor() {
        this.timers = new Map();
    }
    addTimeout(id, timeout) {
        if (!this.timers.get(id)) {
            return this.timers.set(id, [timeout]);
        }
        this.timers.get(id).push(timeout);
    }
    clearFileInfoBufferTimeouts(id) {
        const timeouts = this.timers.get(id);
        if (!timeouts) {
            return;
        }
        timeouts.forEach((timeout) => {
            clearTimeout(timeout);
        });
    }
}
exports.default = TimeoutManager;
