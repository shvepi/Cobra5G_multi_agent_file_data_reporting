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
const Subscription_1 = __importDefault(require("./models/Subscription"));
const logger_1 = __importDefault(require("../logger"));
const Logger = (0, logger_1.default)(__filename);
class MongoDBSubscriptionsDataSource {
    constructor() { }
    createSubscription(subscription) {
        return __awaiter(this, void 0, void 0, function* () {
            const newSubscription = new Subscription_1.default(Object.assign({}, subscription));
            yield newSubscription.save();
            Logger.debug(`new subscription: ${newSubscription}`);
            const subscriptionDoc = newSubscription.toObject();
            // TS 28.532 12.2.1.1.8
            // return Subscription data type
            return subscriptionDoc;
        });
    }
    getSubscription(id) {
        return __awaiter(this, void 0, void 0, function* () {
            // keep select without -_id, to test getSubscription
            const subscription = yield Subscription_1.default.findOne({ _id: id }).select("-__v");
            Logger.debug(`subscription: ${subscription}`);
            if (!subscription)
                return null;
            const subscriptionDoc = subscription.toObject();
            return subscriptionDoc;
        });
    }
    getSubscriptions(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            const subscriptions = yield Subscription_1.default.find(filter).select("-__v");
            const subscriptionDocs = subscriptions.map((sub) => sub.toObject());
            Logger.debug(`subscriptions: ${subscriptions}`);
            return subscriptionDocs;
        });
    }
    deleteSubscription(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const subscription = yield Subscription_1.default.findOneAndDelete({
                _id: id,
            }).select("-__v");
            Logger.debug(`subscription: ${subscription}`);
            if (!subscription)
                return null;
            const subscriptionDoc = subscription.toObject();
            return subscriptionDoc;
        });
    }
}
exports.default = MongoDBSubscriptionsDataSource;
