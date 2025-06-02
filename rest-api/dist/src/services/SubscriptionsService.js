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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-unused-vars */
const Service_1 = __importDefault(require("./Service"));
const config_1 = __importDefault(require("../../config"));
class SubscriptionsService {
    constructor(subscriptionsDataSource, notificationsService) {
        this.createSubscription = ({ body }) => __awaiter(this, void 0, void 0, function* () {
            const subscription = body;
            const newSubscription = yield this.subscriptionsDataSource.createSubscription(subscription);
            const response = newSubscription;
            /**
             * TS 28.532 12.2.1.1.8
             * On success "201 Created" shall be returned. The response message body shall
             * carry the representation of the created subscription resource. The Location header
             * shall be present and carry the URI of the created subscription resource.
             */
            response["setHeader"] = {
                Location: "http://localhost:" +
                    config_1.default.URL_PORT +
                    "/fileDataReportingMnS/v1/subscriptions/" +
                    response["_id"],
            };
            delete response["_id"];
            try {
                return Service_1.default.successResponse(response, 201);
            }
            catch (e) {
                const errorResponse = {
                    error: {
                        // @ts-ignore
                        errorInfo: e.message,
                    },
                };
                return Service_1.default.rejectResponse(errorResponse.error, 400);
            }
        });
        this.getSubscription = ({ subscriptionId }) => __awaiter(this, void 0, void 0, function* () {
            const subscription = yield this.subscriptionsDataSource.getSubscription(subscriptionId);
            try {
                if (!subscription)
                    return Service_1.default.rejectResponse({
                        error: {
                            errorInfo: `subscription with id: ${subscriptionId} not found`,
                        },
                    }, 404);
                // id should not be provided in response
                const { _id } = subscription, subscriptionFields = __rest(subscription, ["_id"]);
                return Service_1.default.successResponse(subscriptionFields);
            }
            catch (e) {
                const errorResponse = {
                    error: {
                        // @ts-ignore
                        errorInfo: e.message,
                    },
                };
                return Service_1.default.rejectResponse(errorResponse.error, 400);
            }
        });
        this.deleteSubscription = ({ subscriptionId }) => __awaiter(this, void 0, void 0, function* () {
            const subscription = yield this.subscriptionsDataSource.deleteSubscription(subscriptionId);
            if (!subscription) {
                return Service_1.default.rejectResponse({
                    error: {
                        errorInfo: `file with ID: ${subscriptionId} not found`,
                    },
                }, 404);
            }
            try {
                return Service_1.default.successResponse({}, 204);
            }
            catch (e) {
                return Service_1.default.rejectResponse(
                // @ts-ignore
                e.message || "Invalid input", 
                // @ts-ignore
                e.status || 405);
            }
        });
        this.handleFileCreatedEvent = (file) => __awaiter(this, void 0, void 0, function* () {
            let subscriptions = yield this.findMatchingSubscriptions(file);
            if (!subscriptions.length)
                return;
            /**
             * POST consumerReference
             * Notification data type: NotifyFileReady
             * href: The "objectClass" and "objectInstance" parameters of the
             * 		notification header identify the object representing the
             * 		function (process) making the file available for retrieval,
             * 		such as the "PerfMetricJob" or the "TraceJob" defined in TS 28.622 [11].
             * 		When no dedicated object is standardized or instantiated, the "ManagedElement",
             * 		where the file is processed, shall be used. For the case that the file is
             * 		processed on a mangement node, the "ManagementNode", where the file is processed,
             * 		shall be used instead. - TS 28.532 11.6.1.1.1
             * notificationId: ITU-T Rec. X. 733
             * notifyFileReady: NotificationType: "notifyFileReady"
             * eventTime: Event occurrence time (e.g., the file ready time). TS 28.532, Table 12.6.1.4.2.2-1
             * systemDN: see SystemDN data type - TS 28.623 -> SystemDN type: string
             * 			DN (Distinguished Name) of the MnS Agent emitting the notification - TS 28.532 Table 12.6.1.4.2.2-1
             * 			-> MnS Agent = File Data Reporting Service
             * fileInfoList: List of FileInfos.
             * 	- TS 28.532 11.6.1.1.1:
             * 		... provides information (meta data) about the new file
             * 		and optionally, in addition to that, information
             * 		about all other files, which became ready for upload
             * 		earlier and are still available for upload when the
             * 		notification is sent.
             * additionalText: string
             */
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _a = file.fileInfo, { _id } = _a, fileInfo = __rest(_a, ["_id"]);
            // filter duplicate subscriptions
            subscriptions = subscriptions.filter((sub, index, self) => {
                return (self
                    .map((s) => s.consumerReference)
                    .indexOf(sub.consumerReference) === index);
            });
            // add file info to buffer
            for (const sub of subscriptions) {
                this.notificationsService.fileInfoBufferManager.addToFileInfoBuffer(sub.consumerReference, fileInfo);
            }
            // for (const data of NotifySubscriberData) {
            // 	this.notificationsService.fileInfoBufferManager.addSubscriberBuffer(
            // 		data.url,
            // 		data.body,
            // 	);
            // 	setTimeout(() => {
            // 		if ()
            // 	}, 5000)
            // 	new Promise((resolve) => {
            // 		setTimeout(() => {
            // 		})
            // 	})
            // }
            // const NotifySubscriberData = this.buildNotifySubscriberData(
            // 	subscriptions,
            // 	fileInfo,
            // );
            // this.notificationsService.notifySubscribers(NotifySubscriberData);
        });
        /**
         *
         * @param file for which subscriptions on this will be searched
         * @returns an array of matching subscriptions
         */
        this.findMatchingSubscriptions = (file) => __awaiter(this, void 0, void 0, function* () {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { _id, fileInfo } = file, fileContent = __rest(file, ["_id", "fileInfo"]);
            // build filter criteria
            const orFilters = Array();
            if (fileInfo.fileCompression) {
                orFilters.push({
                    "filter.fileCompression": fileInfo.fileCompression,
                });
            }
            if (fileInfo.fileExpirationTime) {
                orFilters.push({
                    "filter.fileExpirationTime": {
                        $gte: fileInfo.fileExpirationTime,
                    },
                });
            }
            if (fileInfo.fileFormat) {
                orFilters.push({
                    "filter.fileFormat": fileInfo.fileFormat,
                });
            }
            if (fileInfo.fileReadyTime) {
                orFilters.push({
                    "filter.beginTime": {
                        $lte: fileInfo.fileReadyTime,
                    },
                }, {
                    "filter.endTime": {
                        $gte: fileInfo.fileReadyTime,
                    },
                });
            }
            if (fileInfo.fileSize) {
                orFilters.push({
                    "filter.fileSize": {
                        $gte: fileInfo.fileSize,
                    },
                });
            }
            // created file always has a fileDataType
            orFilters.push({
                "filter.fileDataType": fileInfo.fileDataType,
            });
            /**
             * created file always has a fileContent
             * "filter.fileContent": fileContent cannot
             * partially match nested objects
             * The following should match:
             * File:
             * host: "server_0",
             * value: {
             * 	something_else: "d",
             * 	here_another: "d",
             * }
             *
             * Filter:
             * host: "server_0",
             * value: {
             * 	something_else: "d",
             * }
             */
            // filter.fileContent handled in iterateFilters
            orFilters.push({ "filter.fileContent": { $exists: true } });
            // empty filter concerns any and all files
            orFilters.push({ filter: { $exists: false } });
            const subscriptions = yield this.subscriptionsDataSource.getSubscriptions({
                $or: orFilters,
            });
            if (!subscriptions.length)
                return subscriptions;
            // handle one filter criteria matching but another doesn't
            const filteredSubscriptions = subscriptions.filter((sub) => {
                if (sub.filter) {
                    for (const key of Object.keys(sub.filter)) {
                        const filterVal = sub.filter[key];
                        // check if value matches
                        switch (key) {
                            case "fileExpirationTime": {
                                if (!fileInfo.fileExpirationTime)
                                    return false;
                                if (filterVal < fileInfo.fileExpirationTime)
                                    return false;
                                continue;
                            }
                            case "beginTime": {
                                if (!fileInfo.fileReadyTime)
                                    return false;
                                if (filterVal > fileInfo.fileReadyTime)
                                    return false;
                                continue;
                            }
                            case "endTime": {
                                if (!fileInfo.fileReadyTime)
                                    return false;
                                if (filterVal < fileInfo.fileReadyTime)
                                    return false;
                                continue;
                            }
                            case "fileSize": {
                                if (!fileInfo.fileSize)
                                    return false;
                                if (filterVal < fileInfo.fileSize)
                                    return false;
                                continue;
                            }
                            case "fileContent": {
                                /**
                                 * loop over the attributes of sub.filter.fileContent
                                 * as long as the filter partially matches the fileContent,
                                 * it will be a match. The following filter matches the file:
                                 * filterVal: {
                                 * 	host: "server_0",
                                 * 	t: {
                                 * 		something_else: "d",
                                 * 	},
                                 * }
                                 * fileContent: {
                                 * 	host: "server_0",
                                 * 	t: {
                                 * 		something_lse: "d",
                                 * 		another_one: "d"
                                 * 	}
                                 * }
                                 */
                                return this.iterateFilters(filterVal, fileContent);
                            }
                            default: {
                                if (filterVal !== fileInfo[key])
                                    return false;
                            }
                        }
                    }
                }
                return sub;
            });
            return filteredSubscriptions;
        });
        /**
         * Iterate through Nested JavaScript Objects
         * https://stackoverflow.com/a/54272512
         * @param filter
         * @param file
         * @returns
         */
        this.iterateFilters = (filter, file) => {
            const stack = [{ filter, file }];
            while ((stack === null || stack === void 0 ? void 0 : stack.length) > 0) {
                const currentObj = stack.pop();
                if (!currentObj)
                    return false;
                for (const key of Object.keys(currentObj.filter)) {
                    /**
                     * filter is more specific than file, return false
                     * filter: {
                     * 	host: "server_0",
                     * 	another_value: "d"
                     * }
                     * file: {
                     * 	host: "server_0"
                     * }
                     */
                    if (!currentObj.file[key])
                        return false;
                    if (typeof currentObj.filter[key] === "object" &&
                        currentObj.filter[key] !== null) {
                        stack.push({
                            filter: currentObj.filter[key],
                            file: currentObj.file[key],
                        });
                        continue;
                    }
                    if (currentObj.filter[key] !== currentObj.file[key]) {
                        return false;
                    }
                }
            }
            return true;
        };
        this.subscriptionsDataSource = subscriptionsDataSource;
        this.notificationsService = notificationsService;
        notificationsService.addFileCreatedEmitterListener("fileCreated", this.handleFileCreatedEvent);
    }
}
exports.default = SubscriptionsService;
