import { ErrorResponse as ErrorResponseData } from "./openapi-types";

export class ErrorResponse extends Error {
	error: ErrorResponseData;
	code?: number;

	constructor(error: ErrorResponseData, code?: number) {
		super();
		this.error = error;
		this.code = code;
	}

	public override toString() {
		return "b";
	}
}

export class SubscriberNotifyError extends Error {
	code?: number;

	constructor(code?: number) {
		super();
		this.code = code;
	}

	public override toString() {
		return "SubscriberNotifyError";
	}
}

export class SubscriberNotifyShouldRetryError extends Error {
	code?: number;

	constructor(code?: number) {
		super();
		this.code = code;
	}

	public override toString() {
		return "SubscriberNotifyError";
	}
}
