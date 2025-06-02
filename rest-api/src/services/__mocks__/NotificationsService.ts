/* eslint-disable @typescript-eslint/no-unused-vars */

export default class NotificationsService {
	fileCreatedEmitter;
	constructor() {
		this.fileCreatedEmitter = jest.fn();
	}

	addFileCreatedEmitterListener = jest.fn((event, callback) => {
		console.log("addFileCreatedEmitterListener");
		return;
	});
	notifySubscribers = jest.fn((data) => {
		console.log("notifySubscribers: " + JSON.stringify(data));
		return;
	});
}
