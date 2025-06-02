import { FileInfo, NotifySubscriberData } from "../common/types/openapi-types";
import logger from "../common/logger";
const Logger = logger(__filename);

type FileInfoBuffer = {
	lastActivity: Date;
	fileInfos: FileInfo[];
};

class FileInfoBufferManager {
	private fileInfoBuffers: Map<string, FileInfoBuffer>;
	private bufferSize: number;
	private timeout: number;
	private sendNotificationCallback;
	constructor(
		bufferSize: number = 10,
		timeout: number = 5000,
		sendNotificationCallback,
	) {
		this.fileInfoBuffers = new Map();
		this.bufferSize = bufferSize;
		this.timeout = timeout;
		this.sendNotificationCallback = sendNotificationCallback;
	}

	addToFileInfoBuffer = (subscriber: string, fileInfo: FileInfo) => {
		Logger.debug(`Adding file info to buffer for ${subscriber}`);
		const fileInfoBuffer = this.fileInfoBuffers.get(subscriber);
		if (!fileInfoBuffer || fileInfoBuffer.fileInfos.length === 0) {
			this.fileInfoBuffers.set(subscriber, {
				lastActivity: new Date(),
				fileInfos: [fileInfo],
			});

			// Wait for x seconds before checking for inactivity
			setTimeout(() => {
				this.checkForInactivity(subscriber);
			}, this.timeout);
			return;
		}

		fileInfoBuffer.fileInfos.push(fileInfo);
		fileInfoBuffer.lastActivity = new Date();

		// Check if buffer size has reached a certain limit
		if (fileInfoBuffer.fileInfos.length >= this.bufferSize) {
			Logger.debug(`Buffer size reached for ${subscriber}`);
			this.processNotification(subscriber);
		} else {
			// Wait for x seconds before checking for inactivity
			setTimeout(() => {
				this.checkForInactivity(subscriber);
			}, this.timeout);
		}
	};

	deleteFileInfoBuffer = (subscriber: string) => {
		Logger.debug(`Deleting file info buffer for ${subscriber}`);
		this.fileInfoBuffers.delete(subscriber);
	};

	private checkForInactivity = (subscriber: string) => {
		const fileInfoBuffer = this.fileInfoBuffers.get(subscriber);
		if (
			fileInfoBuffer &&
			Date.now() - fileInfoBuffer.lastActivity.getTime() >= this.timeout
		) {
			// No new files for x seconds, process notifications
			this.processNotification(subscriber);
		}
	};

	private processNotification = (subscriber: string) => {
		const fileInfoBuffer = this.fileInfoBuffers.get(subscriber);
		if (fileInfoBuffer && fileInfoBuffer.fileInfos.length > 0) {
			// build the request body
			const data: NotifySubscriberData = {
				url: subscriber,
				body: {
					href: "10.0.4.101:2000", // zabbix-for-nwdaf VM
					notificationId: 1,
					notificationType: "notifyFileReady",
					eventTime: fileInfoBuffer.fileInfos[0].fileReadyTime,
					systemDN: "",
					fileInfoList: fileInfoBuffer.fileInfos,
					additionalText: "",
				},
			};
			Logger.debug(`Processing notification for ${subscriber}`);

			// Send notifications to the subscriber
			this.sendNotificationCallback(data);
		}
	};
}

export default FileInfoBufferManager;
