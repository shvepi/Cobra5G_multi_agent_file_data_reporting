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
const config_1 = __importDefault(require("../../../config"));
const mongoose_1 = __importDefault(require("mongoose"));
const FileInfo_1 = __importDefault(require("./models/FileInfo"));
const File_1 = __importDefault(require("./models/File"));
const logger_1 = __importDefault(require("../logger"));
const Logger = (0, logger_1.default)(__filename);
class MongoDBFilesDataSource {
    constructor() { }
    createFile(file) {
        return __awaiter(this, void 0, void 0, function* () {
            const { fileContent } = file, fileInfoFields = __rest(file, ["fileContent"]);
            const newFile = new File_1.default(Object.assign({ _id: new mongoose_1.default.Types.ObjectId() }, fileContent));
            yield newFile.save();
            const newFileId = newFile._id;
            const newFileInfo = new FileInfo_1.default(Object.assign(Object.assign({}, fileInfoFields), { fileLocation: "http://localhost:" +
                    config_1.default.URL_PORT +
                    "/fileDataReportingMnS/v1/files/" +
                    newFileId }));
            yield newFileInfo.save();
            // keep fileInfo: newFileInfo, not newFileInfo._id
            // newFileDoc.fileInfo will not be populated
            newFile.set({ fileInfo: newFileInfo });
            yield newFile.save();
            Logger.debug(`new file: ${newFile}`);
            const newFileDoc = newFile.toObject();
            return newFileDoc;
        });
    }
    createFiles(files) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileInfos = [];
            for (const file of files) {
                const { fileContent } = file, fileInfoFields = __rest(file, ["fileContent"]);
                const newFile = new File_1.default(Object.assign({ _id: new mongoose_1.default.Types.ObjectId() }, fileContent));
                yield newFile.save();
                const newFileId = newFile._id;
                const newFileInfo = new FileInfo_1.default(Object.assign(Object.assign({}, fileInfoFields), { fileLocation: "http://localhost:" +
                        config_1.default.URL_PORT +
                        "/fileDataReportingMnS/v1/files/" +
                        newFileId }));
                yield newFileInfo.save();
                newFile.set({ fileInfo: newFileInfo });
                yield newFile.save();
                Logger.debug(`new file: ${newFile}`);
                fileInfos.push(newFile.toObject());
            }
            return fileInfos;
        });
    }
    getFile(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const file = yield File_1.default.findOne({ _id: id })
                .populate({
                path: "fileInfo",
                select: "-__v",
            })
                .select("-__v");
            Logger.debug(`file: ${file}`);
            if (!file)
                return null;
            const fileDoc = file.toObject();
            return fileDoc;
        });
    }
    getFileInfo(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileInfos = yield FileInfo_1.default.find(Object.assign({ fileDataType: filter["fileDataType"] }, ((filter["beginTime"] || filter["endTime"]) && {
                fileReadyTime: Object.assign(Object.assign({}, (filter["beginTime"] && {
                    $gte: filter["beginTime"],
                })), (filter["endTime"] && {
                    $lte: filter["endTime"],
                })),
            }))).select("-__v -_id");
            Logger.debug(`fileInfos: ${fileInfos}`);
            return fileInfos;
        });
    }
    deleteFile(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const file = yield File_1.default.findOneAndDelete({ _id: id })
                .populate({
                path: "fileInfo",
                select: "-__v",
            })
                .select("-__v");
            Logger.debug(`file: ${file}`);
            if (!file)
                return null;
            if (!file.fileInfo)
                return null;
            yield FileInfo_1.default.findOneAndDelete({ _id: file.fileInfo });
            const fileDoc = file.toObject();
            return fileDoc;
        });
    }
}
exports.default = MongoDBFilesDataSource;
