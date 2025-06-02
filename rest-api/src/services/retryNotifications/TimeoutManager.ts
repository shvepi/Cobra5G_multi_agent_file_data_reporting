class TimeoutManager {
	// mapping of FileInfoBufferKey to timeouts
	private timers: Map<string, NodeJS.Timeout[]>;
	constructor() {
		this.timers = new Map();
	}
	addTimeout(id: string, timeout: NodeJS.Timeout) {
		if (!this.timers.get(id)) {
			return this.timers.set(id, [timeout]);
		}
		this.timers.get(id)!.push(timeout);
	}
	clearFileInfoBufferTimeouts(id: string) {
		const timeouts = this.timers.get(id);
		if (!timeouts) {
			return;
		}
		timeouts.forEach((timeout) => {
			clearTimeout(timeout);
		});
	}
}

export default TimeoutManager;
