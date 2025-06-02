"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileInfoBufferManager = void 0;
const TimeoutManager_1 = __importDefault(require("./TimeoutManager"));
const logger_1 = __importDefault(require("../../common/logger"));
const uuid_1 = require("uuid");
const Logger = (0, logger_1.default)(__filename);
class FileInfoBufferManager {
    constructor(bufferSize = 10, timeoutMilliSeconds = 5000, sendNotificationCallback) {
        this.getBufferSize = () => {
            return this.bufferSize;
        };
        this.getTimeoutMilliSeconds = () => {
            return this.timeoutMilliSeconds;
        };
        this.findEmptyFileInfoBuffer = (fileInfoBufferMap) => {
            for (const [id, fileInfoBuffer] of fileInfoBufferMap) {
                if (fileInfoBuffer.fileInfos.length < this.bufferSize) {
                    const t = [id, fileInfoBuffer];
                    return t;
                }
            }
            return null;
        };
        this.addToFileInfoBuffer = (subscriber, fileInfo) => {
            Logger.debug(`Adding file info to buffer for ${subscriber}`);
            const fileInfoBufferMap = this.fileInfoBuffers.get(subscriber);
            if (!fileInfoBufferMap) {
                const newFileInfoBufferMap = new Map();
                const newFileInfoBuffer = {
                    lastActivity: new Date(),
                    fileInfos: [fileInfo],
                    isInRetryTimeout: false,
                };
                const fileInfoBufferKey = (0, uuid_1.v4)();
                newFileInfoBufferMap.set(fileInfoBufferKey, newFileInfoBuffer);
                this.fileInfoBuffers.set(subscriber, newFileInfoBufferMap);
                // Wait for x seconds before checking for inactivity
                const timeout = setTimeout(() => {
                    this.checkForInactivityRetry(subscriber, fileInfoBufferKey, newFileInfoBuffer);
                }, this.timeoutMilliSeconds);
                this.timeoutManager.addTimeout(fileInfoBufferKey, timeout);
                return;
            }
            // Find the first buffer with space
            const fileInfoBufferTuple = this.findEmptyFileInfoBuffer(fileInfoBufferMap);
            if (!fileInfoBufferTuple) {
                // create new buffer
                Logger.debug(`No empty file info buffer found for ${subscriber}`);
                const newFileInfoBuffer = {
                    lastActivity: new Date(),
                    fileInfos: [fileInfo],
                    isInRetryTimeout: false,
                };
                // fileInfoBufferKey should not be a time string of when the buffer was created
                // consider the case where the buffer limit is 10 but there are 15 fileinfos
                // that are added in quick succession. FileInfoBufferKey will be the same for
                // every fileInfoBuffer. This will cause the first buffer to be overwritten
                const fileInfoBufferKey = (0, uuid_1.v4)();
                fileInfoBufferMap.set(fileInfoBufferKey, newFileInfoBuffer);
                this.fileInfoBuffers.set(subscriber, fileInfoBufferMap);
                // Wait for x seconds before checking for inactivity
                const timeout = setTimeout(() => {
                    this.checkForInactivityRetry(subscriber, fileInfoBufferKey, newFileInfoBuffer);
                }, this.timeoutMilliSeconds);
                this.timeoutManager.addTimeout(fileInfoBufferKey, timeout);
                return;
            }
            const [fileInfoBufferKey, fileInfoBuffer] = fileInfoBufferTuple;
            fileInfoBuffer.fileInfos.push(fileInfo);
            fileInfoBuffer.lastActivity = new Date();
            if (fileInfoBuffer.isInRetryTimeout) {
                // if buffer is in retry timeout, do nothing
                // the notification will be sent once the timeout is over
                Logger.debug(`FileInfoBuffer ${fileInfoBufferKey} for ${subscriber} is in retry timeout`);
                return;
            }
            else if (fileInfoBuffer.fileInfos.length >= this.bufferSize) {
                // If buffer size has reached a certain limit and is not in retry timeout
                // process notifications
                Logger.debug(`Buffer size reached for ${subscriber}`);
                this.processNotificationRetry(subscriber, fileInfoBufferKey, fileInfoBuffer);
            }
            else {
                // Wait for x seconds before checking for inactivity
                const timeout = setTimeout(() => {
                    this.checkForInactivityRetry(subscriber, fileInfoBufferKey, fileInfoBuffer);
                }, this.timeoutMilliSeconds);
                this.timeoutManager.addTimeout(fileInfoBufferKey, timeout);
            }
        };
        this.getFileInfoBuffer = (subscriber) => {
            return this.fileInfoBuffers.get(subscriber);
        };
        this.getFileInfoBuffers = () => {
            return this.fileInfoBuffers;
        };
        this.deleteFileInfoBufferMap = (subscriber) => {
            Logger.debug(`Deleting file info buffer map for ${subscriber}`);
            this.fileInfoBuffers.delete(subscriber);
        };
        this.deleteFileInfoBuffer = (subscriber, fileInfoBufferKey) => {
            Logger.debug(`Deleting file info buffer [${fileInfoBufferKey}] for ${subscriber}`);
            const fileInfoBufferMap = this.fileInfoBuffers.get(subscriber);
            if (!fileInfoBufferMap) {
                return;
            }
            fileInfoBufferMap.delete(fileInfoBufferKey);
        };
        this.processNotificationRetry = (subscriber, fileInfoBufferKey, fileInfoBuffer) => {
            // cancel all other timeouts for this buffer
            // so that the notification is only sent once
            this.timeoutManager.clearFileInfoBufferTimeouts(fileInfoBufferKey);
            // build the request body
            const data = {
                url: subscriber,
                body: {
                    href: "10.0.4.101:2000",
                    notificationId: 1,
                    notificationType: "notifyFileReady",
                    eventTime: fileInfoBuffer.fileInfos[0].fileReadyTime,
                    systemDN: "",
                    fileInfoList: fileInfoBuffer.fileInfos,
                    additionalText: "",
                },
            };
            Logger.debug(`Processing notification for ${subscriber} and buffer key ${fileInfoBufferKey}`, data);
            // Send notifications to the subscriber
            this.sendNotificationCallback(data, fileInfoBufferKey, fileInfoBuffer, 0, 5000);
        };
        this.checkForInactivityRetry = (subscriber, fileInfoBufferKey, fileInfoBuffer) => {
            if (fileInfoBuffer &&
                Date.now() - fileInfoBuffer.lastActivity.getTime() >=
                    this.timeoutMilliSeconds) {
                // No new files for x seconds, process notifications
                this.processNotificationRetry(subscriber, fileInfoBufferKey, fileInfoBuffer);
            }
        };
        this.fileInfoBuffers = new Map();
        this.bufferSize = bufferSize;
        this.timeoutMilliSeconds = timeoutMilliSeconds;
        this.sendNotificationCallback = sendNotificationCallback;
        this.timeoutManager = new TimeoutManager_1.default();
    }
}
exports.FileInfoBufferManager = FileInfoBufferManager;
