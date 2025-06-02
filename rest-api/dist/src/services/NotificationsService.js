"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_events_1 = require("node:events");
const axios_1 = __importDefault(require("axios"));
const FileInfoBufferManager_1 = __importDefault(require("../services/FileInfoBufferManager"));
const logger_1 = __importDefault(require("../common/logger"));
const Logger = (0, logger_1.default)(__filename);
class NotificationsService {
    constructor() {
        this.addFileCreatedEmitterListener = (event, callback) => {
            this.fileCreatedEmitter.addListener(event, callback);
        };
        this.notifySubscriber = (data) => {
            axios_1.default
                .post(data.url, data.body)
                .then(() => {
                Logger.info(`notified: ${data.url}`);
                this.fileInfoBufferManager.deleteFileInfoBuffer(data.url);
            })
                .catch((err) => {
                Logger.error(`err notifying ${data.url}: ${err}`);
                this.fileInfoBufferManager.deleteFileInfoBuffer(data.url);
            });
            return;
        };
        this.fileCreatedEmitter = new node_events_1.EventEmitter();
        this.fileInfoBufferManager = new FileInfoBufferManager_1.default(10, 5000, this.notifySubscriber);
    }
}
exports.default = NotificationsService;
