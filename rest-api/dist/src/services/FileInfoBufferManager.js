"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../common/logger"));
const Logger = (0, logger_1.default)(__filename);
class FileInfoBufferManager {
    constructor(bufferSize = 10, timeout = 5000, sendNotificationCallback) {
        this.addToFileInfoBuffer = (subscriber, fileInfo) => {
            Logger.debug(`Adding file info to buffer for ${subscriber}`);
            const fileInfoBuffer = this.fileInfoBuffers.get(subscriber);
            if (!fileInfoBuffer || fileInfoBuffer.fileInfos.length === 0) {
                this.fileInfoBuffers.set(subscriber, {
                    lastActivity: new Date(),
                    fileInfos: [fileInfo],
                });
                // Wait for x seconds before checking for inactivity
                setTimeout(() => {
                    this.checkForInactivity(subscriber);
                }, this.timeout);
                return;
            }
            fileInfoBuffer.fileInfos.push(fileInfo);
            fileInfoBuffer.lastActivity = new Date();
            // Check if buffer size has reached a certain limit
            if (fileInfoBuffer.fileInfos.length >= this.bufferSize) {
                Logger.debug(`Buffer size reached for ${subscriber}`);
                this.processNotification(subscriber);
            }
            else {
                // Wait for x seconds before checking for inactivity
                setTimeout(() => {
                    this.checkForInactivity(subscriber);
                }, this.timeout);
            }
        };
        this.deleteFileInfoBuffer = (subscriber) => {
            Logger.debug(`Deleting file info buffer for ${subscriber}`);
            this.fileInfoBuffers.delete(subscriber);
        };
        this.checkForInactivity = (subscriber) => {
            const fileInfoBuffer = this.fileInfoBuffers.get(subscriber);
            if (fileInfoBuffer &&
                Date.now() - fileInfoBuffer.lastActivity.getTime() >= this.timeout) {
                // No new files for x seconds, process notifications
                this.processNotification(subscriber);
            }
        };
        this.processNotification = (subscriber) => {
            const fileInfoBuffer = this.fileInfoBuffers.get(subscriber);
            if (fileInfoBuffer && fileInfoBuffer.fileInfos.length > 0) {
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
                Logger.debug(`Processing notification for ${subscriber}`);
                // Send notifications to the subscriber
                this.sendNotificationCallback(data);
            }
        };
        this.fileInfoBuffers = new Map();
        this.bufferSize = bufferSize;
        this.timeout = timeout;
        this.sendNotificationCallback = sendNotificationCallback;
    }
}
exports.default = FileInfoBufferManager;
