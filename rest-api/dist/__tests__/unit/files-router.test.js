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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-unused-vars */
const supertest_1 = __importDefault(require("supertest"));
const path_1 = __importDefault(require("path"));
const FilesController_1 = __importDefault(require("../../src/controllers/FilesController"));
const expressServer_1 = __importDefault(require("../../src/expressServer"));
const FilesRouter_1 = __importDefault(require("../../src/routers/FilesRouter"));
const openApiYaml = path_1.default.join(__dirname, "..", "fixtures", "testOpenApi.yaml");
// const schema = jsYaml.load(fs.readFileSync(openApiYaml));
// jestOpenAPI(schema);
const server = new expressServer_1.default(8080, openApiYaml);
jest.mock("../../src/controllers/FilesController");
// @ts-ignore
const filesController = new FilesController_1.default();
server.addRoute((0, FilesRouter_1.default)(filesController));
afterEach(() => {
    jest.clearAllMocks();
});
describe("GET /files", () => {
    // @ts-ignore
    filesController.filesGET.mockImplementationOnce((req, res) => {
        res.sendStatus(200);
    });
    it("should call filesGET with correct request parameters", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server.app).get("/fileDataReportingMnS/v1/files?fileDataType=Performance");
        expect(filesController.filesGET).toHaveBeenCalled();
        expect(filesController.filesGET).toHaveBeenCalledWith(expect.objectContaining({
            query: {
                fileDataType: "Performance",
            },
        }), expect.objectContaining({}), expect.objectContaining({}));
    }));
});
describe("GET /files/:fileId", () => {
    it("should call filesGETById given valid id", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server.app).get("/fileDataReportingMnS/v1/files/6535036e6f00ddce36b42909");
        expect(filesController.filesGETById).toHaveBeenCalled();
        expect(filesController.filesGETById).toHaveBeenCalledWith(expect.objectContaining({
            openapi: expect.objectContaining({
                pathParams: {
                    fileId: "6535036e6f00ddce36b42909",
                },
            }),
        }), expect.objectContaining({}), expect.objectContaining({}));
    }));
    it("should fail if fileId is invalid", () => __awaiter(void 0, void 0, void 0, function* () {
        // @ts-ignore
        filesController.filesGETById.mockImplementationOnce((req, res) => {
            res.sendStatus(200);
        });
        const res = yield (0, supertest_1.default)(server.app)
            .get("/fileDataReportingMnS/v1/files/1")
            .expect(400);
        expect(filesController.filesGETById).not.toHaveBeenCalled();
    }));
});
describe("POST /files", () => {
    // @ts-ignore
    filesController.filesPOST.mockImplementationOnce((req, res) => {
        res.sendStatus(200);
    });
    it("should call filesPOST with a single file object in request body", () => __awaiter(void 0, void 0, void 0, function* () {
        const mockData = {
            fileContent: {
                host: "EDGE_PC",
                installed_softwares: ["sql", "pip", "python"],
            },
            fileDataType: "Proprietary",
            fileReadyTime: "2023-10-30T00:00:00+01:00",
        };
        const res = yield (0, supertest_1.default)(server.app)
            .post("/fileDataReportingMnS/v1/files")
            .send(mockData);
        expect(filesController.filesPOST).toHaveBeenCalled();
        expect(filesController.filesPOST).toHaveBeenCalledWith(expect.objectContaining({
            body: mockData,
        }), expect.objectContaining({}), expect.objectContaining({}));
    }));
});
describe("POST /files/create_many", () => {
    // @ts-ignore
    filesController.filesPOSTMany.mockImplementationOnce((req, res) => {
        res.sendStatus(200);
    });
    it("should call filesPOSTMany with file objects in request body", () => __awaiter(void 0, void 0, void 0, function* () {
        const mockData = [
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
            .send(mockData);
        expect(filesController.filesPOSTMany).toHaveBeenCalled();
        expect(filesController.filesPOSTMany).toHaveBeenCalledWith(expect.objectContaining({
            body: mockData,
        }), expect.objectContaining({}), expect.objectContaining({}));
    }));
});
describe("DELETE /files/:fileId", () => {
    it("should call filesDELETE given valid id", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server.app).delete("/fileDataReportingMnS/v1/files/6535036e6f00ddce36b42909");
        expect(filesController.filesDELETE).toHaveBeenCalled();
        expect(filesController.filesDELETE).toHaveBeenCalledWith(expect.objectContaining({
            openapi: expect.objectContaining({
                pathParams: {
                    fileId: "6535036e6f00ddce36b42909",
                },
            }),
        }), expect.objectContaining({}), expect.objectContaining({}));
    }));
});
