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
const SubscriptionsController_1 = __importDefault(require("../../src/controllers/SubscriptionsController"));
const expressServer_1 = __importDefault(require("../../src/expressServer"));
const SubscriptionsRouter_1 = __importDefault(require("../../src/routers/SubscriptionsRouter"));
const openApiYaml = path_1.default.join(__dirname, "..", "fixtures", "testOpenApi.yaml");
// const schema = jsYaml.load(fs.readFileSync(openApiYaml));
// jestOpenAPI(schema);
const server = new expressServer_1.default(8080, openApiYaml);
jest.mock("../../src/controllers/SubscriptionsController");
// @ts-ignore
const subscriptionsController = new SubscriptionsController_1.default();
server.addRoute((0, SubscriptionsRouter_1.default)(subscriptionsController));
afterEach(() => {
    jest.clearAllMocks();
});
describe("POST /subscriptions", () => {
    // @ts-ignore
    subscriptionsController.createSubscription.mockImplementationOnce((req, res) => {
        res.sendStatus(200);
    });
    it("should call createSubscription with a Subscription object in request body", () => __awaiter(void 0, void 0, void 0, function* () {
        const mockData = {
            consumerReference: "http://127.0.0.1:7777/callbackUri",
            timeTick: 1,
            filter: {},
        };
        const res = yield (0, supertest_1.default)(server.app)
            .post("/fileDataReportingMnS/v1/subscriptions")
            .send(mockData);
        expect(subscriptionsController.createSubscription).toHaveBeenCalled();
        expect(subscriptionsController.createSubscription).toHaveBeenCalledWith(expect.objectContaining({
            body: mockData,
        }), expect.objectContaining({}), expect.objectContaining({}));
    }));
    it("should not call createSubscription if consumerReference in the request body is not a URI", () => __awaiter(void 0, void 0, void 0, function* () {
        const invalidDatas = [
            {
                consumerReference: "",
            },
            {
                consumerReference: "",
            },
        ];
        for (const data of invalidDatas) {
            const res = yield (0, supertest_1.default)(server.app)
                .post("/fileDataReportingMnS/v1/subscriptions")
                .send(data);
            expect(subscriptionsController.createSubscription).not.toHaveBeenCalled();
        }
    }));
});
describe("GET /subscriptions/:subscriptionId", () => {
    // @ts-ignore
    subscriptionsController.getSubscription.mockImplementationOnce((req, res) => {
        res.sendStatus(200);
    });
    it("should call getSubscription given valid id", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server.app).get("/fileDataReportingMnS/v1/subscriptions/6535036e6f00ddce36b42909");
        expect(subscriptionsController.getSubscription).toHaveBeenCalled();
        expect(subscriptionsController.getSubscription).toHaveBeenCalledWith(expect.objectContaining({
            openapi: expect.objectContaining({
                pathParams: {
                    subscriptionId: "6535036e6f00ddce36b42909",
                },
            }),
        }), expect.objectContaining({}), expect.objectContaining({}));
    }));
});
describe("DELETE /subscriptions/:subscriptionId", () => {
    // @ts-ignore
    subscriptionsController.deleteSubscription.mockImplementationOnce((req, res) => {
        res.sendStatus(200);
    });
    it("should call deleteSubscription given valid id", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server.app).delete("/fileDataReportingMnS/v1/subscriptions/6535036e6f00ddce36b42909");
        expect(subscriptionsController.deleteSubscription).toHaveBeenCalled();
        expect(subscriptionsController.deleteSubscription).toHaveBeenCalledWith(expect.objectContaining({
            openapi: expect.objectContaining({
                pathParams: {
                    subscriptionId: "6535036e6f00ddce36b42909",
                },
            }),
        }), expect.objectContaining({}), expect.objectContaining({}));
    }));
});
