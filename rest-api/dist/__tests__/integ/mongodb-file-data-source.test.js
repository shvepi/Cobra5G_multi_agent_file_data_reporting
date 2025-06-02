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
/* eslint-disable @typescript-eslint/no-unused-vars */
const mongoose_1 = require("mongoose");
const MongoDBFilesDataSource_1 = __importDefault(require("../../src/common/database/MongoDBFilesDataSource"));
const File_1 = __importDefault(require("../../src/common/database/models/File"));
const FileInfo_1 = __importDefault(require("../../src/common/database/models/FileInfo"));
const TestDatabase_1 = __importDefault(require("../fixtures/TestDatabase"));
const testFiles_1 = require("../fixtures/testFiles");
const helpers_1 = require("../__utils__/helpers");
const mongoDBFilesDataSource = new MongoDBFilesDataSource_1.default();
const testFiles = testFiles_1.validTestFiles;
Object.freeze(testFiles);
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    yield TestDatabase_1.default.connect();
}));
afterEach(() => __awaiter(void 0, void 0, void 0, function* () { return yield TestDatabase_1.default.clearDatabase(); }));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    yield TestDatabase_1.default.closeDatabase();
}));
describe("CRUD operations with mongoDB", () => {
    describe("GET /files", () => {
        it("should get all files with correct fileDataTypes", () => __awaiter(void 0, void 0, void 0, function* () {
            let count = 0;
            const wantedFileDataType = "Performance";
            for (let _a of testFiles) {
                const { fileContent } = _a, fileInfo = __rest(_a, ["fileContent"]);
                if (fileInfo.fileDataType === wantedFileDataType)
                    count++;
                yield new FileInfo_1.default(Object.assign({ fileLocation: "test" }, fileInfo)).save();
            }
            const res = yield mongoDBFilesDataSource.getFileInfo({
                fileDataType: wantedFileDataType,
            });
            expect(res).toHaveLength(count);
            for (const file of res) {
                expect(file).toHaveProperty("fileDataType");
                expect(file.fileDataType).toBe(wantedFileDataType);
            }
        }));
        describe("get all files with correct fileDataTypes and within specified time", () => {
            const wantedFileDataType = "Proprietary";
            const wantedBeginTime = "2023-11-01T00:00:00+01:00";
            it("all fileReadyTime should be later than beginTime", () => __awaiter(void 0, void 0, void 0, function* () {
                for (let _a of testFiles) {
                    const { fileContent } = _a, fileInfo = __rest(_a, ["fileContent"]);
                    yield new FileInfo_1.default(Object.assign({ fileLocation: "test" }, fileInfo)).save();
                }
                const res = yield mongoDBFilesDataSource.getFileInfo({
                    fileDataType: wantedFileDataType,
                    beginTime: wantedBeginTime,
                });
                for (const file of res) {
                    expect(file).toHaveProperty("fileDataType");
                    expect(file.fileDataType).toBe(wantedFileDataType);
                    expect(new Date(file.fileReadyTime).getTime()).toBeGreaterThanOrEqual(new Date(wantedBeginTime).getTime());
                }
            }));
            it("all fileReadyTime should be later than beginTime and earlier than endTime", () => __awaiter(void 0, void 0, void 0, function* () {
                const wantedEndTime = "2023-11-01T23:59:59+01:00";
                for (let _b of testFiles) {
                    const { fileContent } = _b, fileInfo = __rest(_b, ["fileContent"]);
                    yield new FileInfo_1.default(Object.assign({ fileLocation: "test" }, fileInfo)).save();
                }
                const res = yield mongoDBFilesDataSource.getFileInfo({
                    fileDataType: wantedFileDataType,
                    beginTime: wantedBeginTime,
                    endTime: wantedEndTime,
                });
                for (const file of res) {
                    expect(file).toHaveProperty("fileDataType");
                    expect(file.fileDataType).toBe(wantedFileDataType);
                    expect(new Date(file.fileReadyTime).getTime()).toBeGreaterThanOrEqual(new Date(wantedBeginTime).getTime());
                    expect(new Date(file.fileReadyTime).getTime()).toBeLessThanOrEqual(new Date(wantedBeginTime).getTime());
                }
            }));
        });
    });
    describe("GET /files/:fileId", () => {
        const ids = new Array();
        it("should correctly get the corresponding file", () => __awaiter(void 0, void 0, void 0, function* () {
            for (let _a of testFiles) {
                const { fileContent } = _a, fileInfo = __rest(_a, ["fileContent"]);
                const newFile = new File_1.default(Object.assign({ _id: new mongoose_1.Types.ObjectId() }, fileContent));
                yield newFile.save();
                ids.push(newFile._id.toString());
            }
            for (const [index, id] of ids.entries()) {
                const fileDoc = (yield mongoDBFilesDataSource.getFile(id));
                expect(fileDoc).toBeDefined();
                expect(fileDoc._id.toString()).toBe(id);
                expect(fileDoc).toEqual(Object.assign({ _id: fileDoc._id }, testFiles[index].fileContent));
            }
        }));
    });
    describe("POST /files", () => {
        describe("create a single file", () => {
            const file = testFiles[0];
            it("should create a File document containing key value pairs of fileContent", () => __awaiter(void 0, void 0, void 0, function* () {
                const newFile = yield mongoDBFilesDataSource.createFile(file);
                const createdFile = yield File_1.default.findOne({
                    _id: newFile._id,
                }).select("-_id -__v -fileInfo");
                expect(createdFile).toBeDefined();
                expect(createdFile.toObject()).toEqual(file.fileContent);
            }));
            it("should create a FileInfo document containing the file attributes and fileLocation", () => __awaiter(void 0, void 0, void 0, function* () {
                const newFile = yield mongoDBFilesDataSource.createFile(file);
                const createdFileInfo = yield FileInfo_1.default.findOne({
                    fileLocation: {
                        $regex: `${newFile._id}`,
                    },
                }).select("-_id -__v");
                const { fileContent } = file, fileInfo = __rest(file, ["fileContent"]);
                expect(createdFileInfo).toBeDefined();
                expect(createdFileInfo).toHaveProperty("fileLocation");
                expect(createdFileInfo.fileLocation).toContain(newFile._id);
                const fileInfoWithLocation = Object.assign({ fileLocation: createdFileInfo.fileLocation }, fileInfo);
                (0, helpers_1.checkFileInfoEquality)(createdFileInfo.toObject(), fileInfoWithLocation);
            }));
            it("FileInfo document should not have attributes outside of the FileInfo type", () => __awaiter(void 0, void 0, void 0, function* () {
                const file = {
                    fileContent: {
                        host: "EDGE_PC2",
                        ip_addr: "192.168.0.2",
                    },
                    fileDataType: "Proprietary",
                    randomAttribute: "randomValue",
                };
                // @ts-ignore
                const newFile = yield mongoDBFilesDataSource.createFile(file);
                const createdFileInfo = yield FileInfo_1.default.findOne({
                    fileLocation: {
                        $regex: `${newFile._id}`,
                    },
                }).select("-_id -__v");
                expect(createdFileInfo).not.toHaveProperty("randomAttribute");
            }));
        });
    });
    describe("POST /files_many", () => {
        describe("create many files", () => {
            it("should create File documents containing key value pairs of fileContents", () => __awaiter(void 0, void 0, void 0, function* () {
                const newFiles = yield mongoDBFilesDataSource.createFiles(testFiles);
                const ids = newFiles.map((f) => f._id);
                // expect unique IDs
                expect(new Set(ids).size === ids.length).toBe(true);
                for (const [index, id] of ids.entries()) {
                    const createdFile = yield File_1.default.findOne({ _id: id }).select("-_id -__v -fileInfo");
                    expect(createdFile).toBeDefined();
                    expect(createdFile.toObject()).toEqual(testFiles[index].fileContent);
                }
            }));
            it("should create FileInfo documents containing the file attributes and fileLocation", () => __awaiter(void 0, void 0, void 0, function* () {
                const newFiles = yield mongoDBFilesDataSource.createFiles(testFiles);
                for (const [index, file] of newFiles.entries()) {
                    const createdFileInfo = yield FileInfo_1.default.findOne({
                        fileLocation: {
                            $regex: `${file._id}`,
                        },
                    }).select("-_id -__v");
                    const _a = testFiles[index], { fileContent } = _a, fileInfo = __rest(_a, ["fileContent"]);
                    expect(createdFileInfo).toBeDefined();
                    expect(createdFileInfo).toHaveProperty("fileLocation");
                    expect(createdFileInfo.fileLocation).toContain(file._id);
                    const fileInfoWithLocation = Object.assign({ fileLocation: createdFileInfo.fileLocation }, fileInfo);
                    (0, helpers_1.checkFileInfoEquality)(createdFileInfo.toObject(), fileInfoWithLocation);
                }
            }));
            it("FileInfo documents should not have attributes outside of the FileInfo type", () => __awaiter(void 0, void 0, void 0, function* () {
                const testFilesCopy = testFiles.map((file, index) => {
                    if (index % 2 === 0) {
                        file["randomAttribute"] = "randomValue";
                        return file;
                    }
                    return file;
                });
                const newFiles = yield mongoDBFilesDataSource.createFiles(
                // @ts-ignore
                testFilesCopy);
                const ids = newFiles.map((f) => f._id);
                for (const id of ids) {
                    const createdFileInfo = yield FileInfo_1.default.findOne({
                        fileLocation: {
                            $regex: `${id}`,
                        },
                    }).select("-_id -__v");
                    expect(createdFileInfo).not.toHaveProperty("randomAttribute");
                }
            }));
        });
    });
});
