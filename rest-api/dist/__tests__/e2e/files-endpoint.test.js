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
const supertest_1 = __importDefault(require("supertest"));
const path_1 = __importDefault(require("path"));
const jest_openapi_1 = __importDefault(require("jest-openapi"));
const mongoose_1 = __importDefault(require("mongoose"));
const TestDatabase_1 = __importDefault(require("../fixtures/TestDatabase"));
const expressServer_1 = __importDefault(require("../../src/expressServer"));
const MongoDBFilesDataSource_1 = __importDefault(require("../../src/common/database/MongoDBFilesDataSource"));
const FilesController_1 = __importDefault(require("../../src/controllers/FilesController"));
const FilesRouter_1 = __importDefault(require("../../src/routers/FilesRouter"));
const FilesService_1 = __importDefault(require("../../src/services/FilesService"));
const FileInfo_1 = __importDefault(require("../../src/common/database/models/FileInfo"));
const File_1 = __importDefault(require("../../src/common/database/models/File"));
const helpers_1 = require("../__utils__/helpers");
const testFiles_1 = require("../fixtures/testFiles");
const openApiYaml = path_1.default.join(__dirname, "..", "fixtures", "testOpenApi.yaml");
(0, jest_openapi_1.default)(openApiYaml);
const server = new expressServer_1.default(8080, openApiYaml);
const filesDataSource = new MongoDBFilesDataSource_1.default();
const filesController = new FilesController_1.default(new FilesService_1.default(filesDataSource));
server.addRoute((0, FilesRouter_1.default)(filesController));
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    yield TestDatabase_1.default.connect();
}));
afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
    jest.clearAllMocks();
    yield TestDatabase_1.default.clearDatabase();
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    yield TestDatabase_1.default.closeDatabase();
}), 20000);
describe("GET /files", () => {
    it("should fail if fileDataType is not specified in request params", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server.app).get("/fileDataReportingMnS/v1/files");
        expect(res.error).toBeDefined();
        expect(res.status).toBe(400);
    }));
    describe("?fileDataType=", () => {
        let fileInfos = [];
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            for (let _a of testFiles_1.validTestFiles) {
                const { fileContent } = _a, fileInfo = __rest(_a, ["fileContent"]);
                const newFile = new File_1.default(Object.assign({ _id: new mongoose_1.default.Types.ObjectId() }, fileContent));
                yield newFile.save();
                const newFileId = newFile._id;
                const newFileInfo = new FileInfo_1.default(Object.assign({ fileLocation: "/" + newFileId }, fileInfo));
                yield newFileInfo.save();
                newFile.set({ fileInfo: newFileInfo });
                yield newFile.save();
                fileInfos.push(newFileInfo.toObject());
            }
        }));
        afterEach(() => (fileInfos = []));
        it(`should correctly receive "Performance" files`, () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(server.app).get("/fileDataReportingMnS/v1/files?fileDataType=Performance");
            expect(res.body).toBeDefined();
            const performanceFileInfos = fileInfos.filter((file) => file.fileDataType === "Performance");
            expect(performanceFileInfos.length === res.body.length).toBe(true);
            for (let i = 0; i < res.body.length; i++) {
                (0, helpers_1.checkFileInfoEquality)(res.body[i], performanceFileInfos[i]);
            }
            expect(res).toSatisfyApiSpec();
        }));
        it(`should correctly receive "Proprietary" files`, () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(server.app).get("/fileDataReportingMnS/v1/files?fileDataType=Proprietary");
            expect(res.body).toBeDefined();
            const proprietaryFileInfos = fileInfos.filter((file) => file.fileDataType === "Proprietary");
            expect(proprietaryFileInfos.length === res.body.length).toBe(true);
            for (let i = 0; i < res.body.length; i++) {
                (0, helpers_1.checkFileInfoEquality)(res.body[i], proprietaryFileInfos[i]);
            }
            expect(res).toSatisfyApiSpec();
        }));
        it(`should correctly receive "Analytics" files`, () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(server.app).get("/fileDataReportingMnS/v1/files?fileDataType=Analytics");
            expect(res.body).toBeDefined();
            const analyticsFileInfos = fileInfos.filter((file) => file.fileDataType === "Analytics");
            expect(analyticsFileInfos.length === res.body.length).toBe(true);
            for (let i = 0; i < res.body.length; i++) {
                (0, helpers_1.checkFileInfoEquality)(res.body[i], analyticsFileInfos[i]);
            }
            expect(res).toSatisfyApiSpec();
        }));
        it(`should correctly receive "Trace" files`, () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield (0, supertest_1.default)(server.app).get("/fileDataReportingMnS/v1/files?fileDataType=Trace");
            expect(res.body).toBeDefined();
            const traceFileInfos = fileInfos.filter((file) => file.fileDataType === "Trace");
            expect(traceFileInfos.length === res.body.length).toBe(true);
            for (let i = 0; i < res.body.length; i++) {
                (0, helpers_1.checkFileInfoEquality)(res.body[i], traceFileInfos[i]);
            }
            expect(res).toSatisfyApiSpec();
        }));
    });
    describe("2 same file types with different fileReadyTime & 2 same fileReadyTime with different file types", () => {
        const testFiles = [
            {
                fileContent: {
                    host: "EDGE_PC1",
                    installed_softwares: ["sql", "pip", "python"],
                },
                fileDataType: "Proprietary",
                fileReadyTime: "2023-11-02T00:00:00+01:00",
            },
            {
                fileContent: {
                    host: "EDGE_PC2",
                    ip_addr: "192.168.0.2",
                },
                fileDataType: "Proprietary",
                fileReadyTime: "2023-11-01T00:00:00+01:00",
            },
            {
                fileContent: {
                    host: "EDGE_PC2",
                    cpu_util: "50",
                },
                fileDataType: "Performance",
                fileReadyTime: "2023-11-01T00:00:00+01:00",
            },
        ];
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            for (let _a of testFiles) {
                const { fileContent } = _a, fileInfo = __rest(_a, ["fileContent"]);
                const newFile = new File_1.default(Object.assign({ _id: new mongoose_1.default.Types.ObjectId() }, fileContent));
                yield newFile.save();
                const newFileId = newFile._id;
                const newFileInfo = new FileInfo_1.default(Object.assign({ fileLocation: "/" + newFileId }, fileInfo));
                yield newFileInfo.save();
                newFile.set({ fileInfo: newFileInfo });
                yield newFile.save();
            }
        }));
        describe("fileDataType & beginTime", () => {
            describe(`should only include files with fileReadyTime >= beginTime`, () => {
                const wantedFileDataType = "Proprietary";
                it("beginTime <= 3 fileReadyTimes but should match 2 files (1 not matching fileDataType)", () => __awaiter(void 0, void 0, void 0, function* () {
                    const beginTime1 = "2023-11-01T00:00:00+01:00";
                    const encodedBeginTime1 = encodeURIComponent(beginTime1);
                    const res = yield (0, supertest_1.default)(server.app).get(`/fileDataReportingMnS/v1/files?fileDataType=${wantedFileDataType}&beginTime=${encodedBeginTime1}`);
                    expect(res.body).toBeDefined();
                    for (const file of res.body) {
                        expect(new Date(file.fileReadyTime).getTime()).toBeGreaterThanOrEqual(new Date(beginTime1).getTime());
                        expect(file.fileDataType).toBe(wantedFileDataType);
                    }
                    expect(res).toSatisfyApiSpec();
                }));
                it("beginTime <= 1 fileReadyTime and should match 1 file", () => __awaiter(void 0, void 0, void 0, function* () {
                    const beginTime2 = "2023-11-02T00:00:00+01:00";
                    const encodedBeginTime2 = encodeURIComponent(beginTime2);
                    const res2 = yield (0, supertest_1.default)(server.app).get(`/fileDataReportingMnS/v1/files?fileDataType=${wantedFileDataType}&beginTime=${encodedBeginTime2}`);
                    expect(res2.body).toBeDefined();
                    for (const file of res2.body) {
                        expect(new Date(file.fileReadyTime).getTime()).toBeGreaterThanOrEqual(new Date(beginTime2).getTime());
                        expect(file.fileDataType).toBe(wantedFileDataType);
                    }
                    expect(res2).toSatisfyApiSpec();
                }));
                it("beginTime <= 0 fileReadyTimes and should match 0 file", () => __awaiter(void 0, void 0, void 0, function* () {
                    const beginTime3 = "2023-11-03T00:00:00+01:00";
                    const encodedBeginTime3 = encodeURIComponent(beginTime3);
                    const res3 = yield (0, supertest_1.default)(server.app).get(`/fileDataReportingMnS/v1/files?fileDataType=${wantedFileDataType}&beginTime=${encodedBeginTime3}`);
                    expect(res3.body).toBeDefined();
                    expect(res3.body.length).toBe(0);
                    expect(res3).toSatisfyApiSpec();
                }));
            });
        });
        describe("fileDataType & endTime", () => {
            const wantedFileDataType = "Proprietary";
            describe("should only include files with fileReadyTime <= endTime", () => {
                it("endTime >= 3 fileReadyTimes but should match 2 files (1 not matching fileDataType)", () => __awaiter(void 0, void 0, void 0, function* () {
                    const endTime = "2023-11-02T00:00:00+01:00";
                    const encodedEndTime = encodeURIComponent(endTime);
                    const res = yield (0, supertest_1.default)(server.app).get(`/fileDataReportingMnS/v1/files?fileDataType=${wantedFileDataType}&endTime=${encodedEndTime}`);
                    expect(res.body).toBeDefined();
                    for (const file of res.body) {
                        expect(new Date(file.fileReadyTime).getTime()).toBeLessThanOrEqual(new Date(endTime).getTime());
                        expect(file.fileDataType).toBe(wantedFileDataType);
                    }
                    expect(res).toSatisfyApiSpec();
                }));
                it("endTime >= 2 fileReadyTimes but should match 1 file (1 not matching fileDataType)", () => __awaiter(void 0, void 0, void 0, function* () {
                    const endTime = "2023-11-01T10:00:00+01:00";
                    const encodedEndTime = encodeURIComponent(endTime);
                    const res = yield (0, supertest_1.default)(server.app).get(`/fileDataReportingMnS/v1/files?fileDataType=${wantedFileDataType}&endTime=${encodedEndTime}`);
                    expect(res.body).toBeDefined();
                    for (const file of res.body) {
                        expect(new Date(file.fileReadyTime).getTime()).toBeLessThanOrEqual(new Date(endTime).getTime());
                        expect(file.fileDataType).toBe(wantedFileDataType);
                    }
                    expect(res).toSatisfyApiSpec();
                }));
                it("endTime >= 0 fileReadyTime and should match 0 file", () => __awaiter(void 0, void 0, void 0, function* () {
                    const endTime = "2023-11-03T00:00:00+01:00";
                    const encodedEndTime = encodeURIComponent(endTime);
                    const res = yield (0, supertest_1.default)(server.app).get(`/fileDataReportingMnS/v1/files?fileDataType=${wantedFileDataType}&beginTime=${encodedEndTime}`);
                    expect(res.body).toBeDefined();
                    expect(res.body.length).toBe(0);
                    expect(res).toSatisfyApiSpec();
                }));
            });
        });
        describe("fileDataType & beginTime & endTime", () => {
            const wantedFileDataType = "Proprietary";
            it("should only include files with fileReadyTime >= beginTime and <= endTime", () => __awaiter(void 0, void 0, void 0, function* () {
                const beginTime = "2023-11-01T00:00:00+01:00";
                const encodedBeginTime = encodeURIComponent(beginTime);
                const endTime = "2023-11-02T00:00:00+01:00";
                const encodedEndTime = encodeURIComponent(endTime);
                const res = yield (0, supertest_1.default)(server.app).get(`/fileDataReportingMnS/v1/files?fileDataType=${wantedFileDataType}&beginTime=${encodedBeginTime}&endTime=${encodedEndTime}`);
                expect(res.body).toBeDefined();
                for (const file of res.body) {
                    const fileReadyTimeDate = new Date(file.fileReadyTime);
                    expect(fileReadyTimeDate.getTime()).toBeGreaterThanOrEqual(new Date(beginTime).getTime());
                    expect(fileReadyTimeDate.getTime()).toBeLessThanOrEqual(new Date(endTime).getTime());
                    expect(file.fileDataType).toBe(wantedFileDataType);
                }
                expect(res).toSatisfyApiSpec();
            }));
        });
    });
});
describe("GET /files/:fileId", () => {
    let fileIds = [];
    const testFiles = [
        {
            fileContent: {
                host: "EDGE_PC1",
                installed_softwares: ["sql", "pip", "python"],
            },
            fileDataType: "Proprietary",
            fileReadyTime: "2023-11-02T00:00:00+01:00",
        },
        {
            fileContent: {
                host: "EDGE_PC2",
                ip_addr: "192.168.0.2",
            },
            fileDataType: "Proprietary",
            fileReadyTime: "2023-11-01T00:00:00+01:00",
        },
        {
            fileContent: {
                host: "EDGE_PC2",
                cpu_util: "50",
            },
            fileDataType: "Proprietary",
            fileReadyTime: "2023-11-01T00:00:00+01:00",
        },
    ];
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        for (let _a of testFiles) {
            const { fileContent } = _a, fileInfo = __rest(_a, ["fileContent"]);
            const newFile = new File_1.default(Object.assign({ _id: new mongoose_1.default.Types.ObjectId() }, fileContent));
            yield newFile.save();
            const newFileId = newFile._id;
            const newFileInfo = new FileInfo_1.default(Object.assign({ fileLocation: "/" + newFileId }, fileInfo));
            yield newFileInfo.save();
            newFile.set({ fileInfo: newFileInfo });
            yield newFile.save();
            fileIds.push(newFileId.toString());
        }
    }));
    afterEach(() => (fileIds = []));
    it("should return correct files given valid id", () => __awaiter(void 0, void 0, void 0, function* () {
        for (let i = 0; i < fileIds.length; i++) {
            const res = yield (0, supertest_1.default)(server.app).get(`/fileDataReportingMnS/v1/files/${fileIds[i]}`);
            expect(res).toSatisfyApiSpec();
            expect(res.body).toBeDefined();
            expect(res.body._id).toEqual(fileIds[i]);
            const { fileContent } = testFiles[i];
            expect(res.body).toEqual(expect.objectContaining(fileContent));
        }
    }));
    it("should return status code 404 if file is not found", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server.app)
            .get("/fileDataReportingMnS/v1/files/999999999999999999999999")
            .expect(404);
        expect(res).toSatisfyApiSpec();
    }));
});
describe("POST /files", () => {
    it("should create a file given valid request", () => __awaiter(void 0, void 0, void 0, function* () {
        const testFile = {
            fileContent: {
                host: "EDGE_PC",
                installed_softwares: ["sql", "pip", "python"],
            },
            fileDataType: "Proprietary",
            fileReadyTime: "2023-10-30T00:00:00+01:00",
        };
        const { fileContent: testFileContent } = testFile, testFileInfo = __rest(testFile, ["fileContent"]);
        const res = yield (0, supertest_1.default)(server.app)
            .post("/fileDataReportingMnS/v1/files")
            .send(testFile);
        expect(res).toSatisfyApiSpec();
        // file document should be created
        const createdFileId = res.body.fileId;
        const createdFile = yield File_1.default.findOne({
            _id: createdFileId,
        }).select("-_id -__v -fileInfo");
        expect(createdFile).toBeDefined();
        const createdFileDoc = createdFile.toObject();
        expect(createdFileDoc).toEqual(testFile.fileContent);
        // fileInfo document should be created
        const createdFileInfo = yield FileInfo_1.default.findOne({
            fileLocation: {
                $regex: `${createdFileId}`,
            },
        }).select("-_id -__v");
        expect(createdFileInfo).toBeDefined();
        (0, helpers_1.checkFileInfoEquality)(createdFileInfo.toObject(), Object.assign(Object.assign({}, testFileInfo), { fileLocation: createdFileInfo.fileLocation }));
    }));
});
describe("POST /files/create_many", () => {
    it("should create many files given valid request", () => __awaiter(void 0, void 0, void 0, function* () {
        const testFiles = [
            {
                fileContent: {
                    host: "EDGE_PC",
                    installed_softwares: ["sql", "pip", "python"],
                },
                fileDataType: "Proprietary",
                fileReadyTime: "2023-10-30T00:00:00+01:00",
            },
            {
                fileContent: {
                    host: "Server",
                    cpu_util: 80,
                },
                fileDataType: "Performance",
                fileReadyTime: "2023-10-30T00:00:00+01:00",
            },
        ];
        const res = yield (0, supertest_1.default)(server.app)
            .post("/fileDataReportingMnS/v1/files/create_many")
            .send(testFiles);
        expect(res).toSatisfyApiSpec();
        const createdFileIds = res.body;
        for (let i = 0; i < createdFileIds.length; i++) {
            const id = createdFileIds[i];
            const _a = testFiles[i], { fileContent: testFileContent } = _a, testFileInfo = __rest(_a, ["fileContent"]);
            // file document should be created
            const createdFile = yield File_1.default.findOne({
                _id: id,
            }).select("-_id -__v -fileInfo");
            expect(createdFile).toBeDefined();
            const createdFileDoc = createdFile.toObject();
            expect(createdFileDoc).toEqual(testFileContent);
            // fileInfo document should be created
            const createdFileInfo = yield FileInfo_1.default.findOne({
                fileLocation: {
                    $regex: `${id}`,
                },
            }).select("-_id -__v");
            expect(createdFileInfo).toBeDefined();
            (0, helpers_1.checkFileInfoEquality)(createdFileInfo.toObject(), Object.assign(Object.assign({}, testFileInfo), { fileLocation: createdFileInfo.fileLocation }));
        }
    }));
});
describe("DELETE /files/:fileId", () => {
    it("should delete file with corresponding fileId", () => __awaiter(void 0, void 0, void 0, function* () {
        // ########## SETUP ##########
        const testFiles = [
            {
                fileContent: {
                    host: "EDGE_PC",
                    installed_softwares: ["sql", "pip", "python"],
                },
                fileDataType: "Proprietary",
                fileReadyTime: "2023-10-30T00:00:00+01:00",
            },
            {
                fileContent: {
                    host: "Server",
                    cpu_util: 80,
                },
                fileDataType: "Performance",
                fileReadyTime: "2023-10-30T00:00:00+01:00",
            },
        ];
        const fileIds = [];
        for (let _a of testFiles) {
            const { fileContent } = _a, fileInfo = __rest(_a, ["fileContent"]);
            const newFile = new File_1.default(Object.assign({ _id: new mongoose_1.default.Types.ObjectId() }, fileContent));
            yield newFile.save();
            const newFileId = newFile._id;
            fileIds.push(newFileId.toString());
            const newFileInfo = new FileInfo_1.default(Object.assign(Object.assign({}, fileInfo), { fileLocation: "http://localhost:8080/fileDataReportingMnS/v1/files/" +
                    newFileId }));
            yield newFileInfo.save();
            newFile.set({ fileInfo: newFileInfo });
            yield newFile.save();
        }
        // ########## END SETUP ##########
        // only the file with corresponding fileId shall be deleted
        const res = yield (0, supertest_1.default)(server.app).delete(`/fileDataReportingMnS/v1/files/${fileIds[0]}`);
        expect(res).toSatisfyApiSpec();
        const deletedFile = yield File_1.default.findOne({ _id: fileIds[0] });
        expect(deletedFile).toBeNull();
        // other testFile should not be deleted
        const otherTestFile = testFiles[1];
        const { fileContent: testFileContent } = otherTestFile, testFileInfo = __rest(otherTestFile, ["fileContent"]);
        const otherFile = yield File_1.default.findOne({ _id: fileIds[1] }).select("-_id -__v -fileInfo");
        expect(otherFile).toBeDefined();
        const otherFileDoc = otherFile.toObject();
        expect(otherFileDoc).toEqual(testFileContent);
        const otherFileInfo = yield FileInfo_1.default.findOne({
            fileLocation: {
                $regex: `${fileIds[1]}`,
            },
        }).select("-_id -__v");
        expect(otherFileInfo).toBeDefined();
        (0, helpers_1.checkFileInfoEquality)(otherFileInfo.toObject(), Object.assign(Object.assign({}, testFileInfo), { fileLocation: otherFileInfo.fileLocation }));
    }));
});
describe("POST /files -> " +
    "GET /files?fileDataType={fileDataType} -> " +
    "GET /files/{fileId} -> " +
    "DELETE /files/{fileId}", () => {
    const testFile = {
        fileContent: {
            host: "EDGE_PC",
            installed_softwares: ["sql", "pip", "python"],
        },
        fileDataType: "Proprietary",
        fileReadyTime: "2023-10-30T00:00:00+01:00",
    };
    const { fileContent: testFileContent } = testFile, testFileInfo = __rest(testFile, ["fileContent"]);
    it("should correctly create, retrieve and delete files", () => __awaiter(void 0, void 0, void 0, function* () {
        // POST /files
        const createFileResponse = yield (0, supertest_1.default)(server.app)
            .post("/fileDataReportingMnS/v1/files/")
            .send(testFile);
        const fileId = createFileResponse.body.fileId;
        expect(typeof fileId).toBe("string");
        // GET /files/{fileId}
        const getFileByIdResponse = yield (0, supertest_1.default)(server.app).get("/fileDataReportingMnS/v1/files/" + fileId);
        expect(getFileByIdResponse.body).toBeDefined();
        expect(getFileByIdResponse.body._id).toEqual(fileId);
        expect(getFileByIdResponse.body).toEqual(expect.objectContaining(testFile.fileContent));
        // GET /files?fileDataType={fileDataType}
        const getFilesResponse = yield (0, supertest_1.default)(server.app).get("/fileDataReportingMnS/v1/files?" + `fileDataType=Proprietary`);
        expect(getFilesResponse.body[0]).toBeDefined();
        (0, helpers_1.checkFileInfoEquality)(getFilesResponse.body[0], Object.assign(Object.assign({}, testFileInfo), { fileLocation: getFilesResponse.body[0].fileLocation }));
        // DELETE /files/{fileId}
        const deleteFileResponse = yield (0, supertest_1.default)(server.app).delete("/fileDataReportingMnS/v1/files/" + fileId);
        // ########## File should be deleted ##########
        const getFileByIdResponse2 = yield (0, supertest_1.default)(server.app).get("/fileDataReportingMnS/v1/files/" + fileId);
        expect(getFileByIdResponse2.error).toBeDefined();
        expect(getFileByIdResponse2.statusCode).toBe(404);
        // GET /files?fileDataType={fileDataType}
        const getFilesResponse2 = yield (0, supertest_1.default)(server.app).get("/fileDataReportingMnS/v1/files?" + `fileDataType=Proprietary`);
        expect(getFilesResponse2.body.length).toBe(0);
    }));
});
