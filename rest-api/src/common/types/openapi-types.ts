import { operations, components } from "./generated-types";

export type FileInfo = components["schemas"]["FileInfo"];

export type FileInfoDocument = FileInfo & {
	_id: string;
};

/**
 * Represents a File document to store to the database.
 * fileInfoId is needed for when the File document is to be deleted,
 * as the corresponding FileInfo document should also be deleted
 */
export type FileDocument = {
	_id: string;
	fileInfo: FileInfoDocument;
	[dynamicField: string]: any;
};

export type AddFile = components["schemas"]["AddFile"];

export type Subscription = components["schemas"]["Subscription"] & {
	consumerReference: string;
};

export type SubscriptionDocument = Subscription & {
	_id: string;
};

export type ErrorResponse = components["schemas"]["ErrorResponse"];

export type FilesGETQueryParams = operations["filesGET"]["parameters"]["query"];
export type FilesGETResponses = operations["filesGET"]["responses"];

export type Subscriber = Subscription & {
	id: string;
};

export type FilesPOSTResponses = operations["filesPOST"]["responses"];
export type FilesPOSTManyResponses = operations["filesPOSTMany"]["responses"];

export type FilesDeleteResponses = operations["filesDELETE"]["responses"];

export type SubscriptionsPOSTResponses =
	operations["subscriptionsPOST"]["responses"];

export type SubscriptionsDELETEResponses =
	operations["subscriptionsSubscriptionIdDELETE"]["responses"];

export type NotifyFileReady = components["schemas"]["NotifyFileReady"];
export type NotifyFilePreparationError =
	components["schemas"]["NotifyFilePreparationError"];
export type NotifySubscriberData = {
	url: string;
	body: NotifyFileReady | NotifyFilePreparationError;
};
