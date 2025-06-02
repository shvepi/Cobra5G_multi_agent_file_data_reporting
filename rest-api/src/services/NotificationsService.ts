import { EventEmitter } from "node:events";
import axios from "axios";
import { NotifySubscriberData } from "../common/types/openapi-types";
import FileInfoBufferManager from "../services/FileInfoBufferManager";
import logger from "../common/logger";

const Logger = logger(__filename);

export default class NotificationsService {
	fileCreatedEmitter: EventEmitter;
	fileInfoBufferManager: FileInfoBufferManager;
	constructor() {
		this.fileCreatedEmitter = new EventEmitter();
		this.fileInfoBufferManager = new FileInfoBufferManager(
			10,
			5000,
			this.notifySubscriber,
		);
	}

	addFileCreatedEmitterListener = (
		event: string,
		callback: (...args: any[]) => void,
	) => {
		this.fileCreatedEmitter.addListener(event, callback);
	};

	notifySubscriber = (data: NotifySubscriberData) => {
		axios
			.post(data.url, data.body)
			.then(() => {
				Logger.info(`notified: ${data.url}`);
				this.fileInfoBufferManager.deleteFileInfoBuffer(data.url);
			})
			.catch((err) => {
				Logger.error(`err notifying ${data.url}: ${err}`);
				this.fileInfoBufferManager.deleteFileInfoBuffer(data.url);
			});
		return;
	};

	// notifySubscribers = (data: NotifySubscriberData[]) => {
	// 	Logger.debug(JSON.stringify(data, null, "\t"));
	// 	if (!data.length) return;
	// 	data.forEach((d) => {
	// 		axios
	// 			.post(d.url, d.body)
	// 			.then(() => {
	// 				Logger.info(`notified: ${d.url}`);
	// 			})
	// 			.catch((err) => {
	// 				Logger.error(`err occurred: ${err}`);
	// 			});
	// 	});
	// 	return;
	// };
}
