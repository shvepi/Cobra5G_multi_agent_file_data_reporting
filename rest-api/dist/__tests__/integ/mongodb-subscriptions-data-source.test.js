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
const TestDatabase_1 = __importDefault(require("../fixtures/TestDatabase"));
const testSubscriptions_1 = require("../fixtures/testSubscriptions");
const MongoDBSubscriptionsDataSource_1 = __importDefault(require("../../src/common/database/MongoDBSubscriptionsDataSource"));
const Subscription_1 = __importDefault(require("../../src/common/database/models/Subscription"));
const mongoDBSubscriptionsDataSource = new MongoDBSubscriptionsDataSource_1.default();
const testSubscriptions = testSubscriptions_1.validTestSubscriptions;
Object.freeze(testSubscriptions);
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    yield TestDatabase_1.default.connect();
}));
afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
    yield TestDatabase_1.default.clearDatabase();
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    yield TestDatabase_1.default.closeDatabase();
}));
describe("POST /subscriptions", () => {
    describe("should successfully create a single subscription", () => {
        const subscription = {
            consumerReference: "http://127.0.0.1:7777/callbackUri",
        };
        it("should create a Subscription document containing key value pairs of the passed subscription", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield mongoDBSubscriptionsDataSource.createSubscription(subscription);
            const createdSubscription = yield Subscription_1.default.findOne({
                _id: res["_id"],
            }).select("-_id -__v");
            expect(createdSubscription).toBeDefined();
            expect(createdSubscription.toObject()).toEqual(subscription);
        }));
        it("Subscription document should not have attributes outside of the Subscription type", () => __awaiter(void 0, void 0, void 0, function* () {
            const subscriptionAdditional = {
                consumerReference: "http://127.0.0.1:7777/callbackUri",
                randomAttribute: 1,
            };
            const res = yield mongoDBSubscriptionsDataSource.createSubscription(subscriptionAdditional);
            const createdSubscription = yield Subscription_1.default.findOne({
                _id: res["_id"],
            }).select("-_id -__v");
            expect(createdSubscription).not.toHaveProperty("randomAttribute");
        }));
    });
    it("should allow duplicate consumerReference between different subscriptions", () => { });
    it("should have no effect if the exact same subscription is provided as previously", () => { });
    it("should notify the subscriber of new files it's subscribed to", () => { });
});
describe("GET /subscriptions/:subscriptionId", () => {
    const ids = new Array();
    it("should correctly get the corresponding subscription", () => __awaiter(void 0, void 0, void 0, function* () {
        for (const sub of testSubscriptions) {
            const newSub = new Subscription_1.default(sub);
            yield newSub.save();
            ids.push(newSub._id.toString());
        }
        for (const [index, id] of ids.entries()) {
            const subscription = yield mongoDBSubscriptionsDataSource.getSubscription(id);
            expect(subscription).toBeDefined();
            expect(subscription["_id"].toString()).toBe(id);
            expect(subscription).toEqual(Object.assign({ _id: subscription["_id"] }, testSubscriptions[index]));
        }
    }));
});
describe("DELETE /subscriptions/:subscriptionId", () => {
    it("should delete a subscription with corresponding subscriptionId", () => __awaiter(void 0, void 0, void 0, function* () {
        const subscription = {
            consumerReference: "http://127.0.0.1:7777/callbackUri",
            filter: {
                fileContent: {
                    installed_softwares: ["sql"],
                },
                fileDataType: "Performance",
            },
        };
        const createdSubscription = new Subscription_1.default(subscription);
        createdSubscription.save();
        const newId = createdSubscription._id;
        const res = yield mongoDBSubscriptionsDataSource.deleteSubscription(newId.toString());
        expect(res).toBeDefined();
        const deletedSubscription = yield Subscription_1.default.findOne({ _id: newId });
        expect(deletedSubscription).toBe(null);
    }));
});
