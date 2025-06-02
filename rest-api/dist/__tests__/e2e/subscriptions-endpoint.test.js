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
const supertest_1 = __importDefault(require("supertest"));
const path_1 = __importDefault(require("path"));
const jest_openapi_1 = __importDefault(require("jest-openapi"));
const TestDatabase_1 = __importDefault(require("../fixtures/TestDatabase"));
const expressServer_1 = __importDefault(require("../../src/expressServer"));
const MongoDBSubscriptionsDataSource_1 = __importDefault(require("../../src/common/database/MongoDBSubscriptionsDataSource"));
const SubscriptionsController_1 = __importDefault(require("../../src/controllers/SubscriptionsController"));
const SubscriptionsRouter_1 = __importDefault(require("../../src/routers/SubscriptionsRouter"));
const SubscriptionsService_1 = __importDefault(require("../../src/services/SubscriptionsService"));
const Subscription_1 = __importDefault(require("../../src/common/database/models/Subscription"));
const NotificationsService_1 = __importDefault(require("../../src/services/NotificationsService"));
const openApiYaml = path_1.default.join(__dirname, "..", "fixtures", "testOpenApi.yaml");
(0, jest_openapi_1.default)(openApiYaml);
const server = new expressServer_1.default(8080, openApiYaml);
const subscriptionsDataSource = new MongoDBSubscriptionsDataSource_1.default();
const subscriptionsController = new SubscriptionsController_1.default(new SubscriptionsService_1.default(subscriptionsDataSource, new NotificationsService_1.default()));
server.addRoute((0, SubscriptionsRouter_1.default)(subscriptionsController));
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
describe("POST /subscriptions", () => {
    it("should fail if consumerReference is not specified", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server.app)
            .post("/fileDataReportingMnS/v1/subscriptions")
            .send({});
        expect(res.error).toBeDefined();
        expect(res.status).toBe(400);
    }));
    it("should create a subscription given valid request", () => __awaiter(void 0, void 0, void 0, function* () {
        const testSubscription = {
            consumerReference: "http://127.0.0.1:7777/callback",
            filter: {
                fileDataType: "Performance",
            },
        };
        const res = yield (0, supertest_1.default)(server.app)
            .post("/fileDataReportingMnS/v1/subscriptions")
            .send(testSubscription);
        expect(res).toSatisfyApiSpec();
        // jest-openapi doesn't check if Location header is there
        expect(res.header.location).toBeDefined();
        // get subscriptionId
        const subscriptionId = res.header.location.split("/").pop();
        const createdSubscription = yield Subscription_1.default.findOne({
            _id: subscriptionId,
        }).select("-_id -__v");
        expect(createdSubscription).toBeDefined();
        const createdSubscriptionDoc = createdSubscription.toObject();
        expect(createdSubscriptionDoc).toEqual(testSubscription);
    }));
});
describe("GET /subscriptions/{subscriptionId}", () => {
    it("should get subscription given valid request", () => __awaiter(void 0, void 0, void 0, function* () {
        const testSubscription = {
            consumerReference: "http://127.0.0.1:7777/callback",
            filter: {
                fileDataType: "Performance",
            },
        };
        const newSubscription = new Subscription_1.default(Object.assign({}, testSubscription));
        yield newSubscription.save();
        const newSubscriptionDoc = newSubscription.toObject();
        const newSubscriptionId = newSubscriptionDoc._id;
        const res = yield (0, supertest_1.default)(server.app).get("/fileDataReportingMnS/v1/subscriptions/" + newSubscriptionId);
        expect(res).toSatisfyApiSpec();
        expect(res.body).toBeDefined();
        expect(res.body).toEqual(testSubscription);
    }));
    it("should return status code 404 if subscription is not found", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(server.app)
            .get("/fileDataReportingMnS/v1/subscriptions/999999999999999999999999")
            .expect(404);
        expect(res).toSatisfyApiSpec();
    }));
});
describe("DELETE /subscriptions", () => {
    it("should delete file with corresponding id", () => __awaiter(void 0, void 0, void 0, function* () {
        // ########## SETUP ##########
        const testSubscriptions = [
            {
                consumerReference: "http://127.0.0.1:7777/callback",
                filter: {
                    fileDataType: "Performance",
                },
            },
            {
                consumerReference: "http://127.0.0.1:7777/callback",
                filter: {
                    fileDataType: "Analytics",
                },
            },
        ];
        const subscriptionIds = [];
        for (const testSubscription of testSubscriptions) {
            const newSubscription = new Subscription_1.default(Object.assign({}, testSubscription));
            yield newSubscription.save();
            const newSubscriptionDoc = newSubscription.toObject();
            const newSubscriptionId = newSubscriptionDoc._id;
            subscriptionIds.push(newSubscriptionId);
        }
        // ########## END SETUP ##########
        // only the subscription with corresponding subscriptionId shall be deleted
        const res = yield (0, supertest_1.default)(server.app).delete("/fileDataReportingMnS/v1/subscriptions/" + subscriptionIds[0]);
        expect(res).toSatisfyApiSpec();
        const deletedSubscription = yield Subscription_1.default.findOne({
            _id: subscriptionIds[0],
        });
        expect(deletedSubscription).toBeNull();
        // other subscriptions shall not be deleted
        const otherSubscription = yield Subscription_1.default.findOne({
            _id: subscriptionIds[1],
        }).select("-_id -__v");
        expect(otherSubscription).toBeDefined();
        const otherSubscriptionDoc = otherSubscription.toObject();
        expect(otherSubscriptionDoc).toEqual(testSubscriptions[1]);
    }));
});
describe("POST /subscriptions -> " +
    "GET /subscriptions/{subscriptionId} -> " +
    "DELETE /subscriptions/{subscriptionId}", () => {
    const testSubscription = {
        consumerReference: "http://127.0.0.1:7777/callback",
        filter: {
            fileDataType: "Performance",
        },
    };
    it("should correctly create, retrieve, and delete subscription", () => __awaiter(void 0, void 0, void 0, function* () {
        // POST /subscriptions
        const createSubscriptionResponse = yield (0, supertest_1.default)(server.app)
            .post("/fileDataReportingMnS/v1/subscriptions")
            .send(testSubscription);
        expect(createSubscriptionResponse).toSatisfyApiSpec();
        expect(createSubscriptionResponse.header.location).toBeDefined();
        // get subscriptionId
        const subscriptionId = createSubscriptionResponse.header.location
            .split("/")
            .pop();
        // GET /subscriptions/{subscriptionId}
        const getSubscriptionResponse = yield (0, supertest_1.default)(server.app).get("/fileDataReportingMnS/v1/subscriptions/" + subscriptionId);
        expect(getSubscriptionResponse).toSatisfyApiSpec();
        expect(getSubscriptionResponse.body).toBeDefined();
        expect(getSubscriptionResponse.body).toEqual(testSubscription);
        // DELETE /subscriptions/{subscriptionId}
        const deleteSubscriptionResponse = yield (0, supertest_1.default)(server.app).delete("/fileDataReportingMnS/v1/subscriptions/" + subscriptionId);
        // ########## Subscription should be deleted ##########
        const getSubscriptionResponseAfterDelete = yield (0, supertest_1.default)(server.app)
            .get("/fileDataReportingMnS/v1/subscriptions/" + subscriptionId)
            .expect(404);
        expect(getSubscriptionResponseAfterDelete).toSatisfyApiSpec();
    }));
});
