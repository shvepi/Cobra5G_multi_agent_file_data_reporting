"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("winston");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: `.env.${process.env.NODE_ENV}` });
const customFormat = winston_1.format.printf((options) => {
    let str = `[${options.timestamp}] [${options.level}]: ${options.message}`;
    if (process.env.LOG_LEVEL == "debug")
        str += ` (${options.moduleName})`;
    return str;
});
const logger = (0, winston_1.createLogger)({
    transports: [
        new winston_1.transports.Console({
            level: process.env.LOG_LEVEL || "info",
            format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.colorize(), customFormat),
        }),
    ],
});
if (process.env.NODE_ENV == "production") {
    logger.add(new winston_1.transports.File({
        filename: "error.log",
        level: "error",
        format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.uncolorize(), winston_1.format.json()),
    }));
    logger.add(new winston_1.transports.File({
        filename: "combined.log",
        format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.uncolorize(), winston_1.format.json()),
    }));
}
function default_1(name) {
    const fileName = path_1.default.basename(name);
    return logger.child({ moduleName: fileName });
}
exports.default = default_1;
