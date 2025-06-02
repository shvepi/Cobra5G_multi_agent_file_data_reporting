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
/* eslint-disable @typescript-eslint/no-unused-vars */
const Subscription_1 = __importDefault(require("../../src/common/database/models/Subscription"));
const TestDatabase_1 = __importDefault(require("../fixtures/TestDatabase"));
const SubscriptionsService_1 = __importDefault(require("../../src/services/SubscriptionsService"));
const MongoDBSubscriptionsDataSource_1 = __importDefault(require("../../src/common/database/MongoDBSubscriptionsDataSource"));
const NotificationsService_1 = __importDefault(require("../../src/services/NotificationsService"));
jest.mock("../../src/services/NotificationsService");
const notificationsService = new NotificationsService_1.default();
const subscriptionsService = new SubscriptionsService_1.default(new MongoDBSubscriptionsDataSource_1.default(), notificationsService);
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    yield TestDatabase_1.default.connect();
}));
afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
    yield TestDatabase_1.default.clearDatabase();
    jest.clearAllMocks();
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    yield TestDatabase_1.default.closeDatabase();
}));
/** #################### EXAMPLE SUBSCRIBER FILTERS #################### */
// subscriber 1
const filter1 = {
    fileContent: {
        // key value pairs that match the fileContent
        host: "server_1",
    },
    fileDataType: "Performance",
    beginTime: "2023-10-29T23:00:00.000Z",
};
// subscriber 2
const filter2 = {
    fileContent: {
        // key value pairs that match the fileContent
        host: "server_2",
    },
    fileDataType: "Performance",
};
// any fileContent, etc. as long as fileDataType = "Performance"
const filter3 = {
    fileDataType: "Performance",
};
// any fileContent, etc. as long as fileDataType = "Analytics"
const filter4 = {
    fileDataType: "Analytics",
};
// empty filter / no filter means subscriber subscribes to everything
const filter5 = {};
// any fileDataType, as long as fileContent (partially) matches
const filter6 = {
    fileContent: {
        host: "server_6",
    },
};
// any fileDataType, fileContent, etc. as long as fileSize <= 30 bytes
const filter7 = {
    fileSize: 30,
};
// any fileDataType, fileContent, etc. as long as fileReadyTime between
// 01.11.2023 and 02.11.2023
const filter8 = {
    beginTime: "2023-11-01T00:00:00.000+01:00",
    endTime: "2023-11-02T00:00:00.000+01:00",
};
/** #################### END #################### */
describe("SubscriptionsService.findMatchingSubscriptions", () => {
    it("subscription filter fileContent - " +
        "should match partially matching files", () => __awaiter(void 0, void 0, void 0, function* () {
        const subscription = {
            consumerReference: "http://127.0.0.1:7777/callbackUri",
            filter: {
                fileContent: {
                    host: "server_0",
                    value: {
                        something_else: "d",
                    },
                },
            },
        };
        yield Subscription_1.default.create(subscription);
        // filter should match file1 - fileContent fully matches
        const file1 = {
            _id: "fileId",
            host: "server_0",
            value: {
                something_else: "d",
            },
            fileInfo: {
                _id: "fileInfoId",
                fileLocation: "here",
                fileDataType: "Analytics",
                fileReadyTime: "2023-11-01T02:00:00.000+01:00",
            },
        };
        // filter should match file2
        const file2 = {
            _id: "fileId",
            host: "server_0",
            value: {
                something_else: "d",
                here_another: "d",
            },
            fileInfo: {
                _id: "fileInfoId",
                fileLocation: "here",
                fileDataType: "Analytics",
                fileReadyTime: "2023-11-01T02:00:00.000+01:00",
            },
        };
        // filter should not match file3
        const file3 = {
            _id: "fileId",
            host: "server_1",
            value: {
                something_else: "d",
                here_another: "d",
            },
            fileInfo: {
                _id: "fileInfoId",
                fileLocation: "here",
                fileDataType: "Analytics",
                fileReadyTime: "2023-11-01T02:00:00.000+01:00",
            },
        };
        // filter should not match file4 - filter is more specific
        const file4 = {
            _id: "fileId",
            host: "server_0",
            fileInfo: {
                _id: "fileInfoId",
                fileLocation: "here",
                fileDataType: "Analytics",
                fileReadyTime: "2023-11-01T02:00:00.000+01:00",
            },
        };
        const subs1 = yield subscriptionsService.findMatchingSubscriptions(file1);
        const subs2 = yield subscriptionsService.findMatchingSubscriptions(file2);
        const subs3 = yield subscriptionsService.findMatchingSubscriptions(file3);
        const subs4 = yield subscriptionsService.findMatchingSubscriptions(file4);
        expect(subs1[0]).toMatchObject(Object.assign({ _id: subs1[0]._id }, subscription));
        expect(subs2[0]).toMatchObject(Object.assign({ _id: subs2[0]._id }, subscription));
        expect(subs3).toHaveLength(0);
        expect(subs4).toHaveLength(0);
    }));
    it("subscription filter is empty - " +
        "should match any files - " +
        "TODO", () => __awaiter(void 0, void 0, void 0, function* () { }));
    it("one filter criteria matches, one doesn't - " + "should not match file", () => __awaiter(void 0, void 0, void 0, function* () {
        const subscription = {
            consumerReference: "http://127.0.0.1:7777/callbackUri",
            filter: {
                fileDataType: "Analytics",
                beginTime: "2023-11-01T03:00:00.000+01:00",
            },
        };
        yield Subscription_1.default.create(subscription);
        /**
         * filter should not match file1 because beginTime
         * does not match fileReadyTime, even though
         * fileDataType does.
         */
        const file1 = {
            _id: "fileId",
            host: "server_0",
            value: {
                something_else: "d",
                here_another: "d",
            },
            fileInfo: {
                _id: "fileInfoId",
                fileLocation: "here",
                fileDataType: "Analytics",
                fileReadyTime: "2023-11-01T02:00:00.000+01:00",
            },
        };
        const sub1 = yield subscriptionsService.findMatchingSubscriptions(file1);
        expect(sub1).toHaveLength(0);
    }));
    it("subscription filter only has beginTime and endTime - " +
        "should match files of any fileDataType and any fileContent", () => __awaiter(void 0, void 0, void 0, function* () {
        /**
         * the given filter should match any files that are available
         * (through fileReadyTime) between 11.01.2023 - 11.02.2023 UTC+1
         */
        const subscription = {
            consumerReference: "http://127.0.0.1:7777/callbackUri",
            filter: {
                beginTime: "2023-11-01T00:00:00.000+01:00",
                endTime: "2023-11-02T00:00:00.000+01:00",
            },
        };
        yield Subscription_1.default.create(subscription);
        const file1 = {
            host: "server_3",
            _id: "fileId",
            fileInfo: {
                _id: "fileInfoId",
                fileLocation: "here",
                fileDataType: "Performance",
                fileReadyTime: "2023-11-01T01:00:00.000+01:00",
                fileSize: 20,
            },
        };
        const file2 = {
            _id: "fileId",
            fileInfo: {
                _id: "fileInfoId",
                fileLocation: "here",
                fileDataType: "Analytics",
                fileReadyTime: "2023-11-01T02:00:00.000+01:00",
            },
        };
        const subs1 = yield subscriptionsService.findMatchingSubscriptions(file1);
        const subs2 = yield subscriptionsService.findMatchingSubscriptions(file2);
        expect(subs1[0]).toMatchObject(Object.assign({ _id: subs1[0]._id }, subscription));
        expect(subs2[0]).toMatchObject(Object.assign({ _id: subs2[0]._id }, subscription));
    }));
});
xdescribe("handleFileCreatedEvent", () => {
    it("two files, one matches subscriber - " +
        "should notify subscriber with correct file", () => __awaiter(void 0, void 0, void 0, function* () {
        const subscription = {
            consumerReference: "http://127.0.0.1:7777/callbackUri",
            filter: {
                beginTime: "2023-11-01T00:00:00.000+01:00",
                endTime: "2023-11-02T00:00:00.000+01:00",
            },
        };
        yield Subscription_1.default.create(subscription);
        // filter does not match file1
        const file1 = {
            host: "server_0",
            _id: "fileId",
            fileInfo: {
                _id: "fileInfoId",
                fileLocation: "here",
                fileDataType: "Performance",
                fileReadyTime: "2023-10-30T23:00:00.000+01:00",
                fileSize: 20,
            },
        };
        // filter matches file2
        const file2 = {
            host: "server_3",
            _id: "fileId",
            fileInfo: {
                _id: "fileInfoId",
                fileLocation: "here",
                fileDataType: "Performance",
                fileReadyTime: "2023-11-01T23:00:00.000+01:00",
                fileSize: 20,
            },
        };
        const _a = file2.fileInfo, { _id } = _a, fileInfo2 = __rest(_a, ["_id"]);
        subscriptionsService
            .handleFileCreatedEvent(file1)
            .then(() => console.log("done handling file1"));
        subscriptionsService
            .handleFileCreatedEvent(file2)
            .then(() => console.log("done handling file2"));
        yield new Promise((r) => setTimeout(r, 2000));
        /**
         * expect a call to notificationsService.notifySubscribers to be made
         * with an array containing an object that contains the subscription.
         * It should contain the url of the subscriber and the request body
         * should contain fileInfo of file2 without the ID. The ID is removed
         * to comply with the FileInfo data structure.
         */
        // expect(notificationsService.notifySubscribers).toHaveBeenCalledWith(
        // 	expect.arrayContaining([
        // 		expect.objectContaining({
        // 			url: "http://127.0.0.1:7777/callbackUri",
        // 			body: expect.objectContaining({
        // 				fileInfoList: expect.arrayContaining([fileInfo2]),
        // 			}),
        // 		}),
        // 	]),
        // );
    }));
    // it("should not contain duplicate subscribers, i.e. duplicate consumerReference", async () => {
    // 	const subscriptions = [
    // 		{
    // 			consumerReference: "http://127.0.0.1:7777/callbackUri",
    // 			filter: {
    // 				beginTime: "2023-11-01T00:00:00.000+01:00",
    // 				endTime: "2023-11-02T00:00:00.000+01:00",
    // 			},
    // 		},
    // 		{
    // 			consumerReference: "http://127.0.0.1:7777/callbackUri",
    // 			filter: {
    // 				fileDataType: "Performance",
    // 			},
    // 		},
    // 	];
    // 	await Subscription.insertMany(subscriptions);
    // 	const file1: FileDocument = {
    // 		host: "server_0",
    // 		_id: "fileId",
    // 		fileInfo: {
    // 			_id: "fileInfoId",
    // 			fileLocation: "here",
    // 			fileDataType: "Performance",
    // 			fileReadyTime: "2023-11-01T00:00:00.000+01:00",
    // 		},
    // 	};
    // 	await subscriptionsService.handleFileCreatedEvent(file1);
    // 	expect(notificationsService.notifySubscribers).toHaveBeenCalledWith(
    // 		expect.arrayContaining([
    // 			expect.objectContaining({
    // 				url: "http://127.0.0.1.7777/callbackUri",
    // 			}),
    // 		]),
    // 	);
    // });
});
