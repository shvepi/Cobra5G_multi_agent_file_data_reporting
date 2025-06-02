"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileInfoSchema = void 0;
const mongoose_1 = require("mongoose");
exports.FileInfoSchema = new mongoose_1.Schema({
    fileLocation: {
        type: String,
        required: true,
    },
    fileSize: Number,
    /** Format: date-time */
    fileReadyTime: Date,
    /** Format: date-time */
    fileExpirationTime: Date,
    fileCompression: String,
    fileFormat: String,
    fileDataType: {
        type: String,
        enum: ["Performance", "Trace", "Analytics", "Proprietary"],
        required: true,
    },
}, {
    toObject: {
        transform: function (doc, obj) {
            // change file ID to string
            if (obj._id) {
                obj._id = obj._id.toString();
            }
            delete obj.__v;
        },
    },
});
exports.default = (0, mongoose_1.model)("FileInfo", exports.FileInfoSchema);
