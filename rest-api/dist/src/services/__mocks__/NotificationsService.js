"use strict";
/* eslint-disable @typescript-eslint/no-unused-vars */
Object.defineProperty(exports, "__esModule", { value: true });
class NotificationsService {
    constructor() {
        this.addFileCreatedEmitterListener = jest.fn((event, callback) => {
            console.log("addFileCreatedEmitterListener");
            return;
        });
        this.notifySubscribers = jest.fn((data) => {
            console.log("notifySubscribers: " + JSON.stringify(data));
            return;
        });
        this.fileCreatedEmitter = jest.fn();
    }
}
exports.default = NotificationsService;
