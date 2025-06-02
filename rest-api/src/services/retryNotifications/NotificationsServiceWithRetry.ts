import { EventEmitter } from "node:events";
import axios, { AxiosError } from "axios";
import { NotifySubscriberData } from "../../common/types/openapi-types";
import {
	FileInfoBuffer,
	FileInfoBufferManager,
} from "./FileInfoBufferManagerWithRetry";
import {
	SubscriberNotifyError,
	SubscriberNotifyShouldRetryError,
} from "../../common/types/customErrors";
import logger from "../../common/logger";

const Logger = logger(__filename);

export default class NotificationsService {
	fileCreatedEmitter: EventEmitter;
	fileInfoBufferManager: FileInfoBufferManager;
	retryTimeoutMapping: Record<number, number> = {
		1: 60 * 1000,
		2: 120 * 1000,
		3: 300 * 1000,
		4: 600 * 1000,
	};

	constructor() {
		this.fileCreatedEmitter = new EventEmitter();
		this.fileInfoBufferManager = new FileInfoBufferManager(
			10,
			5000,
			this.notifySubscriberWithRetry,
		);
	}

	addFileCreatedEmitterListener = (
		event: string,
		callback: (...args: any[]) => void,
	) => {
		this.fileCreatedEmitter.addListener(event, callback);
	};

	notifySubscriberWithRetry = (
		data: NotifySubscriberData,
		fileInfoBufferKey: string,
		fileInfoBuffer: FileInfoBuffer,
		retryCount: number,
		timeout: number,
	) => {
		if (retryCount < 5) {
			if (retryCount > 0) {
				Logger.debug(`retrying ${data.url}, retryCount: ${retryCount}`);
			}
			this.makePostRequest(
				data.url,
				data.body,
				fileInfoBufferKey,
				fileInfoBuffer,
				retryCount,
				timeout,
			).then(
				this.handleSuccessfulNotification,
				this.handleRejectedNotification,
			);
		}
	};

	handleSuccessfulNotification = (result) => {
		Logger.info(`notified: ${JSON.stringify(result)}`);
		this.fileInfoBufferManager.deleteFileInfoBuffer(
			result.url,
			result.fileInfoBufferKey,
		);
		return;
	};

	handleRejectedNotification = (result) => {
		if (result.error instanceof SubscriberNotifyError) {
			Logger.debug("SubscriberNotifyError");
			this.fileInfoBufferManager.deleteFileInfoBuffer(
				result.data.url,
				result.fileInfoBufferKey,
			);
			return;
		} else if (result.error instanceof SubscriberNotifyShouldRetryError) {
			const timeout = this.retryTimeoutMapping[result.retryCount];

			if (!timeout) {
				Logger.debug("retry count exceeded, deleting fileInfoBuffer");
				this.fileInfoBufferManager.deleteFileInfoBuffer(
					result.data.url,
					result.fileInfoBufferKey,
				);
				return;
			}

			// retry
			const retryTimestamp = new Date(Date.now() + timeout).toISOString();
			Logger.debug(
				`SubscriberNotifyShouldRetryError will retry at ${retryTimestamp}`,
			);
			setTimeout(() => {
				this.notifySubscriberWithRetry(
					result.data,
					result.fileInfoBufferKey,
					result.fileInfoBuffer,
					result.retryCount,
					timeout,
				);
			}, timeout);
			result.fileInfoBuffer.isInRetryTimeout = true;
		}
	};

	makePostRequest = (
		url: string,
		body: Record<string, unknown>,
		fileInfoBufferKey: string,
		fileInfoBuffer: FileInfoBuffer,
		retryCount: number,
		timeout: number,
	) => {
		return new Promise((resolve, reject) => {
			Logger.debug(`Sending notification: ${url}`);
			axios
				.post(url, body, {
					timeout: 10000,
				})
				.then(() => {
					resolve({ url, fileInfoBufferKey });
				})
				.catch((err: AxiosError) => {
					if (
						err.response &&
						(err.response!.status === 408 ||
							err.response!.status === 429 ||
							err.response!.status === 500 ||
							err.response!.status === 503)
					) {
						// retry here
						reject({
							error: new SubscriberNotifyShouldRetryError(
								err.response!.status,
							),
							data: {
								url,
								body,
							},
							fileInfoBufferKey,
							fileInfoBuffer,
							retryCount: retryCount + 1,
							timeout,
						});
					}
					reject({
						error: new SubscriberNotifyError(),
						data: {
							url,
						},
						fileInfoBufferKey,
					});
				});
		});
	};
}
