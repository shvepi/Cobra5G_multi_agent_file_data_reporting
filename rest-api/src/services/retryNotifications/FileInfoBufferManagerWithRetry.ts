import TimeoutManager from "./TimeoutManager";
import {
	FileInfo,
	NotifySubscriberData,
} from "../../common/types/openapi-types";
import logger from "../../common/logger";
import { v4 as uuidv4 } from "uuid";
const Logger = logger(__filename);

export type FileInfoBuffer = {
	lastActivity: Date;
	fileInfos: FileInfo[];
	isInRetryTimeout: boolean;
};

type FileInfoBufferMap = Map<string, FileInfoBuffer>;

export class FileInfoBufferManager {
	// fileInfoBuffers is a Map of subscriber URLs to a Map of fileInfos
	// The inner map is a Map of the ID of the fileInfoBuffer to fileInfos
	private fileInfoBuffers: Map<string, FileInfoBufferMap>;
	private bufferSize: number;
	private timeoutMilliSeconds: number;
	private timeoutManager: TimeoutManager;
	sendNotificationCallback;
	constructor(
		bufferSize: number = 10,
		timeoutMilliSeconds: number = 5000,
		sendNotificationCallback,
	) {
		this.fileInfoBuffers = new Map();
		this.bufferSize = bufferSize;
		this.timeoutMilliSeconds = timeoutMilliSeconds;
		this.sendNotificationCallback = sendNotificationCallback;
		this.timeoutManager = new TimeoutManager();
	}

	getBufferSize = () => {
		return this.bufferSize;
	};

	getTimeoutMilliSeconds = () => {
		return this.timeoutMilliSeconds;
	};

	findEmptyFileInfoBuffer: (
		fileInfoBufferMap: FileInfoBufferMap,
	) => [string, FileInfoBuffer] | null = (
		fileInfoBufferMap: FileInfoBufferMap,
	) => {
		for (const [id, fileInfoBuffer] of fileInfoBufferMap) {
			if (fileInfoBuffer.fileInfos.length < this.bufferSize) {
				const t: [string, FileInfoBuffer] = [id, fileInfoBuffer];
				return t;
			}
		}
		return null;
	};

	addToFileInfoBuffer = (subscriber: string, fileInfo: FileInfo) => {
		Logger.debug(`Adding file info to buffer for ${subscriber}`);
		const fileInfoBufferMap = this.fileInfoBuffers.get(subscriber);
		if (!fileInfoBufferMap) {
			const newFileInfoBufferMap = new Map();
			const newFileInfoBuffer: FileInfoBuffer = {
				lastActivity: new Date(),
				fileInfos: [fileInfo],
				isInRetryTimeout: false,
			};
			const fileInfoBufferKey = uuidv4();
			newFileInfoBufferMap.set(fileInfoBufferKey, newFileInfoBuffer);
			this.fileInfoBuffers.set(subscriber, newFileInfoBufferMap);

			// Wait for x seconds before checking for inactivity
			const timeout = setTimeout(() => {
				this.checkForInactivityRetry(
					subscriber,
					fileInfoBufferKey,
					newFileInfoBuffer,
				);
			}, this.timeoutMilliSeconds);
			this.timeoutManager.addTimeout(fileInfoBufferKey, timeout);
			return;
		}

		// Find the first buffer with space
		const fileInfoBufferTuple =
			this.findEmptyFileInfoBuffer(fileInfoBufferMap);

		if (!fileInfoBufferTuple) {
			// create new buffer
			Logger.debug(`No empty file info buffer found for ${subscriber}`);

			const newFileInfoBuffer: FileInfoBuffer = {
				lastActivity: new Date(),
				fileInfos: [fileInfo],
				isInRetryTimeout: false,
			};
			// fileInfoBufferKey should not be a time string of when the buffer was created
			// consider the case where the buffer limit is 10 but there are 15 fileinfos
			// that are added in quick succession. FileInfoBufferKey will be the same for
			// every fileInfoBuffer. This will cause the first buffer to be overwritten
			const fileInfoBufferKey = uuidv4();
			fileInfoBufferMap.set(fileInfoBufferKey, newFileInfoBuffer);
			this.fileInfoBuffers.set(subscriber, fileInfoBufferMap);

			// Wait for x seconds before checking for inactivity
			const timeout = setTimeout(() => {
				this.checkForInactivityRetry(
					subscriber,
					fileInfoBufferKey,
					newFileInfoBuffer,
				);
			}, this.timeoutMilliSeconds);
			this.timeoutManager.addTimeout(fileInfoBufferKey, timeout);
			return;
		}
		const [fileInfoBufferKey, fileInfoBuffer] = fileInfoBufferTuple;
		fileInfoBuffer.fileInfos.push(fileInfo);
		fileInfoBuffer.lastActivity = new Date();

		if (fileInfoBuffer.isInRetryTimeout) {
			// if buffer is in retry timeout, do nothing
			// the notification will be sent once the timeout is over
			Logger.debug(
				`FileInfoBuffer ${fileInfoBufferKey} for ${subscriber} is in retry timeout`,
			);
			return;
		} else if (fileInfoBuffer.fileInfos.length >= this.bufferSize) {
			// If buffer size has reached a certain limit and is not in retry timeout
			// process notifications
			Logger.debug(`Buffer size reached for ${subscriber}`);
			this.processNotificationRetry(
				subscriber,
				fileInfoBufferKey,
				fileInfoBuffer,
			);
		} else {
			// Wait for x seconds before checking for inactivity
			const timeout = setTimeout(() => {
				this.checkForInactivityRetry(
					subscriber,
					fileInfoBufferKey,
					fileInfoBuffer,
				);
			}, this.timeoutMilliSeconds);
			this.timeoutManager.addTimeout(fileInfoBufferKey, timeout);
		}
	};

	getFileInfoBuffer = (subscriber: string) => {
		return this.fileInfoBuffers.get(subscriber);
	};

	getFileInfoBuffers = () => {
		return this.fileInfoBuffers;
	};

	deleteFileInfoBufferMap = (subscriber: string) => {
		Logger.debug(`Deleting file info buffer map for ${subscriber}`);
		this.fileInfoBuffers.delete(subscriber);
	};

	deleteFileInfoBuffer = (subscriber: string, fileInfoBufferKey: string) => {
		Logger.debug(
			`Deleting file info buffer [${fileInfoBufferKey}] for ${subscriber}`,
		);
		const fileInfoBufferMap = this.fileInfoBuffers.get(subscriber);
		if (!fileInfoBufferMap) {
			return;
		}
		fileInfoBufferMap.delete(fileInfoBufferKey);
	};

	private processNotificationRetry = (
		subscriber: string,
		fileInfoBufferKey: string,
		fileInfoBuffer: FileInfoBuffer,
	) => {
		// cancel all other timeouts for this buffer
		// so that the notification is only sent once
		this.timeoutManager.clearFileInfoBufferTimeouts(fileInfoBufferKey);

		// build the request body
		const data: NotifySubscriberData = {
			url: subscriber,
			body: {
				href: "10.0.4.101:2000",
				notificationId: 1,
				notificationType: "notifyFileReady",
				eventTime: fileInfoBuffer.fileInfos[0].fileReadyTime,
				systemDN: "",
				fileInfoList: fileInfoBuffer.fileInfos,
				additionalText: "",
			},
		};
		Logger.debug(
			`Processing notification for ${subscriber} and buffer key ${fileInfoBufferKey}`,
			data,
		);

		// Send notifications to the subscriber
		this.sendNotificationCallback(
			data,
			fileInfoBufferKey,
			fileInfoBuffer,
			0,
			5000,
		);
	};

	checkForInactivityRetry = (
		subscriber: string,
		fileInfoBufferKey: string,
		fileInfoBuffer: FileInfoBuffer,
	) => {
		if (
			fileInfoBuffer &&
			Date.now() - fileInfoBuffer.lastActivity.getTime() >=
				this.timeoutMilliSeconds
		) {
			// No new files for x seconds, process notifications
			this.processNotificationRetry(
				subscriber,
				fileInfoBufferKey,
				fileInfoBuffer,
			);
		}
	};
}
