"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_events_1 = require("node:events");
const axios_1 = __importDefault(require("axios"));
const FileInfoBufferManagerWithRetry_1 = require("./FileInfoBufferManagerWithRetry");
const customErrors_1 = require("../../common/types/customErrors");
const logger_1 = __importDefault(require("../../common/logger"));
const Logger = (0, logger_1.default)(__filename);
class NotificationsService {
    constructor() {
        this.retryTimeoutMapping = {
            1: 60 * 1000,
            2: 120 * 1000,
            3: 300 * 1000,
            4: 600 * 1000,
        };
        this.addFileCreatedEmitterListener = (event, callback) => {
            this.fileCreatedEmitter.addListener(event, callback);
        };
        this.notifySubscriberWithRetry = (data, fileInfoBufferKey, fileInfoBuffer, retryCount, timeout) => {
            if (retryCount < 5) {
                if (retryCount > 0) {
                    Logger.debug(`retrying ${data.url}, retryCount: ${retryCount}`);
                }
                this.makePostRequest(data.url, data.body, fileInfoBufferKey, fileInfoBuffer, retryCount, timeout).then(this.handleSuccessfulNotification, this.handleRejectedNotification);
            }
        };
        this.handleSuccessfulNotification = (result) => {
            Logger.info(`notified: ${JSON.stringify(result)}`);
            this.fileInfoBufferManager.deleteFileInfoBuffer(result.url, result.fileInfoBufferKey);
            return;
        };
        this.handleRejectedNotification = (result) => {
            if (result.error instanceof customErrors_1.SubscriberNotifyError) {
                Logger.debug("SubscriberNotifyError");
                this.fileInfoBufferManager.deleteFileInfoBuffer(result.data.url, result.fileInfoBufferKey);
                return;
            }
            else if (result.error instanceof customErrors_1.SubscriberNotifyShouldRetryError) {
                const timeout = this.retryTimeoutMapping[result.retryCount];
                if (!timeout) {
                    Logger.debug("retry count exceeded, deleting fileInfoBuffer");
                    this.fileInfoBufferManager.deleteFileInfoBuffer(result.data.url, result.fileInfoBufferKey);
                    return;
                }
                // retry
                const retryTimestamp = new Date(Date.now() + timeout).toISOString();
                Logger.debug(`SubscriberNotifyShouldRetryError will retry at ${retryTimestamp}`);
                setTimeout(() => {
                    this.notifySubscriberWithRetry(result.data, result.fileInfoBufferKey, result.fileInfoBuffer, result.retryCount, timeout);
                }, timeout);
                result.fileInfoBuffer.isInRetryTimeout = true;
            }
        };
        this.makePostRequest = (url, body, fileInfoBufferKey, fileInfoBuffer, retryCount, timeout) => {
            return new Promise((resolve, reject) => {
                Logger.debug(`Sending notification: ${url}`);
                axios_1.default
                    .post(url, body, {
                    timeout: 10000,
                })
                    .then(() => {
                    resolve({ url, fileInfoBufferKey });
                })
                    .catch((err) => {
                    if (err.response &&
                        (err.response.status === 408 ||
                            err.response.status === 429 ||
                            err.response.status === 500 ||
                            err.response.status === 503)) {
                        // retry here
                        reject({
                            error: new customErrors_1.SubscriberNotifyShouldRetryError(err.response.status),
                            data: {
                                url,
                                body,
                            },
                            fileInfoBufferKey,
                            fileInfoBuffer,
                            retryCount: retryCount + 1,
                            timeout,
                        });
                    }
                    reject({
                        error: new customErrors_1.SubscriberNotifyError(),
                        data: {
                            url,
                        },
                        fileInfoBufferKey,
                    });
                });
            });
        };
        this.fileCreatedEmitter = new node_events_1.EventEmitter();
        this.fileInfoBufferManager = new FileInfoBufferManagerWithRetry_1.FileInfoBufferManager(10, 5000, this.notifySubscriberWithRetry);
    }
}
exports.default = NotificationsService;
