"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionSchema = void 0;
const mongoose_1 = require("mongoose");
exports.SubscriptionSchema = new mongoose_1.Schema({
    consumerReference: {
        type: String,
        required: true,
    },
    timeTick: Number,
    filter: Object,
}, {
    toObject: {
        transform: function (doc, obj) {
            // change subscription ID to string
            if (obj._id) {
                obj._id = obj._id.toString();
            }
            delete obj.__v;
        },
    },
});
exports.default = (0, mongoose_1.model)("Subscription", exports.SubscriptionSchema);
