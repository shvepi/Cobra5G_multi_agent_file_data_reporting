"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validTestSubscriptions = void 0;
exports.validTestSubscriptions = [
    {
        consumerReference: "127.0.0.1:7777/callbackUri",
        timeTick: 20,
        filter: {
            fileDataType: "Performance",
        },
    },
    {
        consumerReference: "127.0.0.10:7777/callbackUri",
    },
    {
        consumerReference: "127.0.0.1:7777/callbackUri",
        timeTick: 20,
        filter: {
            fileDataType: "Proprietary",
        },
    },
];
