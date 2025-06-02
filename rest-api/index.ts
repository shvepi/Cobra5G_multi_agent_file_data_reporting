import dotenv from "dotenv";
import mongoose from "mongoose";
import moment from "moment-timezone";
import ExpressServer from "./src/expressServer";
import config from "./config";
import FilesRouter from "./src/routers/FilesRouter";
import FilesController from "./src/controllers/FilesController";
import FilesService from "./src/services/FilesService";
import MongoDBFilesDataSource from "./src/common/database/MongoDBFilesDataSource";
import logger from "./src/common/logger";
import SubscriptionsRouter from "./src/routers/SubscriptionsRouter";
import SubscriptionsController from "./src/controllers/SubscriptionsController";
import SubscriptionsService from "./src/services/SubscriptionsService";
import MongoDBSubscriptionsDataSource from "./src/common/database/MongoDBSubscriptionsDataSource";
import NotificationsService from "./src/services/retryNotifications/NotificationsServiceWithRetry";

const Logger = logger(__filename);
Date.prototype.toJSON = function () {
	return moment(this).tz("Europe/Berlin").format();
};
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const dbUri = process.env.DB_URI as string;
if (!dbUri) {
	Logger.error("DB_URI not specified in .env file");
	process.exit(1);
}

async function getMongoDS() {
	try {
		Logger.info("Attempting to connect to mongoDB");

		await mongoose.connect(process.env.DB_URI as string);
		Logger.info("Connected to MongoDB");

		return {
			filesDataSource: new MongoDBFilesDataSource(),
			subscriptionsDataSource: new MongoDBSubscriptionsDataSource(),
		};
	} catch (err) {
		Logger.error(err);
		throw err;
	}
}

(async () => {
	try {
		const { filesDataSource, subscriptionsDataSource } = await getMongoDS();
		const notificationsService = new NotificationsService();
		const filesMiddleware = FilesRouter(
			new FilesController(
				new FilesService(filesDataSource, notificationsService),
			),
		);
		const subscriptionsMiddleware = SubscriptionsRouter(
			new SubscriptionsController(
				new SubscriptionsService(
					subscriptionsDataSource,
					notificationsService,
				),
			),
		);

		const server = new ExpressServer(config.URL_PORT, config.OPENAPI_YAML);
		server.addRoute(filesMiddleware);
		server.addRoute(subscriptionsMiddleware);
		server.launch();
	} catch (err) {
		Logger.error(err);
		process.exit(1);
	}
})();
