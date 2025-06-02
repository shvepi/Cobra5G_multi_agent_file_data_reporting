"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: `.env.${process.env.NODE_ENV}` });
// @ts-ignore
const urlPort = parseInt(process.env.API_PORT) || 8080;
const config = {
    ROOT_DIR: __dirname,
    URL_PORT: urlPort,
    URL_PATH: "http://example.com",
    BASE_VERSION: "/3GPPManagement/fileDataReportingMnS/XXX",
    CONTROLLER_DIRECTORY: path_1.default.join(__dirname, "controllers"),
    PROJECT_DIR: __dirname,
};
config.OPENAPI_YAML = path_1.default.join(config.ROOT_DIR, "src", "api", "openapi.yaml");
config.FULL_PATH = `${config.URL_PATH}:${config.URL_PORT}/${config.BASE_VERSION}`;
config.FILE_UPLOAD_PATH = path_1.default.join(config.PROJECT_DIR, "uploaded_files");
exports.default = config;
