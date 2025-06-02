"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSchema = void 0;
const mongoose_1 = require("mongoose");
exports.FileSchema = new mongoose_1.Schema({
    _id: mongoose_1.Types.ObjectId,
    fileInfo: {
        type: mongoose_1.Types.ObjectId,
        ref: "FileInfo",
    },
}, {
    strict: false,
    toObject: {
        transform: function (doc, obj) {
            // change file ID to string
            if (obj._id) {
                obj._id = obj._id.toString();
            }
            if (obj.fileInfo) {
                // change fileInfo ID to string
                if (obj.fileInfo instanceof mongoose_1.Types.ObjectId) {
                    obj.fileInfo = obj.fileInfo.toString();
                }
            }
            delete obj.__v;
        },
    },
});
exports.default = (0, mongoose_1.model)("File", exports.FileSchema);
