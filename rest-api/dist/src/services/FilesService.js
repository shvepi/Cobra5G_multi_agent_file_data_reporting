"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-unused-vars */
const Service_1 = __importDefault(require("./Service"));
const logger_1 = __importDefault(require("../common/logger"));
const Logger = (0, logger_1.default)(__filename);
class FilesService {
    constructor(filesDataSource, notificationsService) {
        this.filesGET = (filesGETQueryParams) => __awaiter(this, void 0, void 0, function* () {
            const files = yield this.filesDataSource.getFileInfo(filesGETQueryParams);
            const response = files;
            try {
                return Service_1.default.successResponse(response);
            }
            catch (e) {
                const errorResponse = {
                    error: {
                        // @ts-ignore
                        errorInfo: e.message,
                    },
                };
                return Service_1.default.rejectResponse(errorResponse.error, 400);
            }
        });
        this.filesGETById = ({ fileId }) => __awaiter(this, void 0, void 0, function* () {
            const file = yield this.filesDataSource.getFile(fileId);
            try {
                if (!file)
                    return Service_1.default.rejectResponse({
                        error: {
                            errorInfo: `file with id: ${fileId} not found`,
                        },
                    }, 404);
                const fileResponse = this.formatFileResponse(file);
                return Service_1.default.successResponse(fileResponse);
            }
            catch (e) {
                const errorResponse = {
                    error: {
                        // @ts-ignore
                        errorInfo: e.message,
                    },
                };
                return Service_1.default.rejectResponse(errorResponse.error, 400);
            }
        });
        this.filesPOST = ({ body }) => __awaiter(this, void 0, void 0, function* () {
            const file = body;
            if (!file.fileContent || !file.fileDataType) {
                let missingAttr = "";
                if (!file.fileContent)
                    missingAttr += "fileContent";
                if (!file.fileDataType)
                    missingAttr += missingAttr
                        ? " and fileDataType"
                        : "fileDataType";
                const errorResponse = {
                    error: {
                        // @ts-ignore
                        errorInfo: `request body should contain ${missingAttr}`,
                    },
                };
                return Service_1.default.rejectResponse(errorResponse);
            }
            const newFile = yield this.filesDataSource.createFile(file);
            // notify subscribers of new file
            this.sendFileCreatedEvent(newFile);
            const id = newFile._id;
            const response = {
                fileId: id,
            };
            try {
                return Service_1.default.successResponse(response, 201);
            }
            catch (e) {
                const errorResponse = {
                    error: {
                        // @ts-ignore
                        errorInfo: e.message,
                    },
                };
                return Service_1.default.rejectResponse(errorResponse.error, 400);
            }
        });
        this.filesPOSTMany = ({ body }) => __awaiter(this, void 0, void 0, function* () {
            const files = body;
            const newFiles = yield this.filesDataSource.createFiles(files);
            // notify subscribers of new files
            for (const file of newFiles) {
                this.sendFileCreatedEvent(file);
            }
            const ids = newFiles.map((file) => file._id);
            const response = ids;
            try {
                return Service_1.default.successResponse(response, 201);
            }
            catch (e) {
                const errorResponse = {
                    error: {
                        // @ts-ignore
                        errorInfo: e.message,
                    },
                };
                return Service_1.default.rejectResponse(errorResponse.error, 400);
            }
        });
        this.filesPUT = ({ subscription }) => __awaiter(this, void 0, void 0, function* () {
            try {
                Service_1.default.successResponse({
                    subscription,
                });
            }
            catch (e) {
                Service_1.default.rejectResponse(
                // @ts-ignore
                e.message || "Invalid input", 
                // @ts-ignore
                e.status || 405);
            }
        });
        this.filesDELETE = ({ fileId }) => __awaiter(this, void 0, void 0, function* () {
            const file = yield this.filesDataSource.deleteFile(fileId);
            if (!file) {
                return Service_1.default.rejectResponse({
                    error: {
                        errorInfo: `file with ID: ${fileId} not found`,
                    },
                }, 404);
            }
            const fileResponse = this.formatFileResponse(file);
            const response = fileResponse;
            try {
                return Service_1.default.successResponse(response);
            }
            catch (e) {
                return Service_1.default.rejectResponse(
                // @ts-ignore
                e.message || "Invalid input", 
                // @ts-ignore
                e.status || 405);
            }
        });
        this.sendFileCreatedEvent = (file) => __awaiter(this, void 0, void 0, function* () {
            if (this.notificationsService) {
                this.notificationsService.fileCreatedEmitter.emit("fileCreated", file);
                Logger.debug("fileCreated event emitted");
            }
        });
        this.formatFileResponse = (file) => {
            const { fileInfo } = file, f = __rest(file, ["fileInfo"]);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { _id } = fileInfo, fileInfoWithoutId = __rest(fileInfo, ["_id"]);
            f.fileInfo = fileInfoWithoutId;
            return Object.assign(Object.assign({}, f), { fileInfo: fileInfoWithoutId });
        };
        this.filesDataSource = filesDataSource;
        if (notificationsService) {
            this.notificationsService = notificationsService;
        }
    }
}
exports.default = FilesService;
