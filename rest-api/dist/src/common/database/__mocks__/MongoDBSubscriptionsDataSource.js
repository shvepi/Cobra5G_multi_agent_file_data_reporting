"use strict";
/* eslint-disable @typescript-eslint/no-unused-vars */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class MongoDBSubscriptionsDataSource {
    constructor() {
        this.createSubscription = jest.fn((subscription) => __awaiter(this, void 0, void 0, function* () {
            console.log("createSubscription: " + JSON.stringify(subscription));
            return Object.assign({ _id: "5f8f2b9a0f0b7a1f9c3f4b9b" }, subscription);
        }));
        this.getSubscription = jest.fn((id) => __awaiter(this, void 0, void 0, function* () {
            return {
                _id: "5f8f2b9a0f0b7a1f9c3f4b9b",
                consumerReference: "127.0.0.1:7777/callback",
            };
        }));
        this.getSubscriptions = jest.fn((filter) => __awaiter(this, void 0, void 0, function* () {
            return [
                {
                    _id: "5f8f2b9a0f0b7a1f9c3f4b9b",
                    consumerReference: "127.0.0.1:7777/callback",
                },
                {
                    // _id should be 24 characters
                    _id: "21783947184529d9fa9d2312",
                    consumerReference: "127.0.0.1:7778/callback",
                },
            ];
        }));
        this.deleteSubscription = jest.fn((id) => __awaiter(this, void 0, void 0, function* () {
            return {
                _id: id,
                consumerReference: "127.0.0.1:7777/callback",
            };
        }));
    }
}
exports.default = MongoDBSubscriptionsDataSource;
