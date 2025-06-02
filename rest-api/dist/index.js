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
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const expressServer_1 = __importDefault(require("./src/expressServer"));
const config_1 = __importDefault(require("./config"));
const FilesRouter_1 = __importDefault(require("./src/routers/FilesRouter"));
const FilesController_1 = __importDefault(require("./src/controllers/FilesController"));
const FilesService_1 = __importDefault(require("./src/services/FilesService"));
const MongoDBFilesDataSource_1 = __importDefault(require("./src/common/database/MongoDBFilesDataSource"));
const logger_1 = __importDefault(require("./src/common/logger"));
const SubscriptionsRouter_1 = __importDefault(require("./src/routers/SubscriptionsRouter"));
const SubscriptionsController_1 = __importDefault(require("./src/controllers/SubscriptionsController"));
const SubscriptionsService_1 = __importDefault(require("./src/services/SubscriptionsService"));
const MongoDBSubscriptionsDataSource_1 = __importDefault(require("./src/common/database/MongoDBSubscriptionsDataSource"));
const NotificationsServiceWithRetry_1 = __importDefault(require("./src/services/retryNotifications/NotificationsServiceWithRetry"));
const Logger = (0, logger_1.default)(__filename);
Date.prototype.toJSON = function () {
    return (0, moment_timezone_1.default)(this).tz("Europe/Berlin").format();
};
dotenv_1.default.config({ path: `.env.${process.env.NODE_ENV}` });
const dbUri = process.env.DB_URI;
if (!dbUri) {
    Logger.error("DB_URI not specified in .env file");
    process.exit(1);
}
function getMongoDS() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            Logger.info("Attempting to connect to mongoDB");
            yield mongoose_1.default.connect(process.env.DB_URI);
            Logger.info("Connected to MongoDB");
            return {
                filesDataSource: new MongoDBFilesDataSource_1.default(),
                subscriptionsDataSource: new MongoDBSubscriptionsDataSource_1.default(),
            };
        }
        catch (err) {
            Logger.error(err);
            throw err;
        }
    });
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { filesDataSource, subscriptionsDataSource } = yield getMongoDS();
        const notificationsService = new NotificationsServiceWithRetry_1.default();
        const filesMiddleware = (0, FilesRouter_1.default)(new FilesController_1.default(new FilesService_1.default(filesDataSource, notificationsService)));
        const subscriptionsMiddleware = (0, SubscriptionsRouter_1.default)(new SubscriptionsController_1.default(new SubscriptionsService_1.default(subscriptionsDataSource, notificationsService)));
        const server = new expressServer_1.default(config_1.default.URL_PORT, config_1.default.OPENAPI_YAML);
        server.addRoute(filesMiddleware);
        server.addRoute(subscriptionsMiddleware);
        server.launch();
    }
    catch (err) {
        Logger.error(err);
        process.exit(1);
    }
}))();
