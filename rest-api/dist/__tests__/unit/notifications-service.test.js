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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const NotificationsServiceWithRetry_1 = __importDefault(require("../../src/services/retryNotifications/NotificationsServiceWithRetry"));
jest.mock("axios");
function flushPromises() {
    return new Promise((resolve) => jest.requireActual("timers").setImmediate(resolve));
}
const notificationsService = new NotificationsServiceWithRetry_1.default();
afterEach(() => {
    // @ts-ignore
    axios_1.default.post.mockReset();
    jest.clearAllMocks();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    notificationsService.fileInfoBufferManager
        .getFileInfoBuffers()
        .forEach((fib) => fib.clear());
    notificationsService.fileInfoBufferManager.getFileInfoBuffers().clear();
});
describe("Send Notifications", () => {
    const consumerReference = "localhost:3000/notifyCallback";
    const fileInfo = {
        fileLocation: "fileLocation",
        fileReadyTime: new Date().toISOString(),
        fileDataType: "Performance",
    };
    it("should create new buffer if previous buffer is full", () => __awaiter(void 0, void 0, void 0, function* () {
        jest.useFakeTimers();
        // @ts-ignore
        axios_1.default.post.mockImplementation(() => {
            return Promise.resolve({
                response: {
                    status: 204,
                },
            });
        });
        const fileInfoBufferManager = notificationsService.fileInfoBufferManager;
        const makePostRequestSpy = jest.spyOn(notificationsService, "makePostRequest");
        const fileInfoList = [];
        for (let i = 0; i < fileInfoBufferManager.getBufferSize(); i++) {
            fileInfoBufferManager.addToFileInfoBuffer(consumerReference, fileInfo);
            fileInfoList.push(fileInfo);
        }
        const differentFileInfo = {
            fileLocation: "differentFileLocation",
            fileReadyTime: new Date().toISOString(),
            fileDataType: "Analytics",
        };
        fileInfoBufferManager.addToFileInfoBuffer(consumerReference, differentFileInfo);
        const fileInfoBufferMap = fileInfoBufferManager.getFileInfoBuffer(consumerReference);
        if (!fileInfoBufferMap) {
            fail("fileInfoBufferMap is undefined");
        }
        expect(fileInfoBufferMap).toBeDefined();
        expect(fileInfoBufferMap.size).toBe(2);
        Array.from(fileInfoBufferMap.entries()).forEach(([key, value], index) => {
            if (index === 0) {
                expect(value.fileInfos).toEqual(expect.arrayContaining(fileInfoList));
            }
            else {
                expect(value.fileInfos).toEqual(expect.arrayContaining([differentFileInfo]));
            }
        });
        // initial timeout for checking for inactivity
        jest.advanceTimersByTime(fileInfoBufferManager.getTimeoutMilliSeconds());
        yield flushPromises();
        // calls[0][0] -> first is the invocation number, second is the argument number
        // first call is with the buffer that's full,
        // second call is with the buffer containing 1 fileInfo
        // expect the first call to be called with the full buffer
        expect(makePostRequestSpy.mock.calls[0][1]).toEqual(expect.objectContaining({
            fileInfoList: expect.arrayContaining(fileInfoList),
        }));
        // expect the second call to be called with the buffer containing 1 fileInfo
        expect(makePostRequestSpy.mock.calls[1][1]).toEqual(expect.objectContaining({
            fileInfoList: expect.arrayContaining([differentFileInfo]),
        }));
    }));
    describe("handle successful notification", () => {
        it("should delete buffer", () => __awaiter(void 0, void 0, void 0, function* () {
            jest.useFakeTimers();
            // @ts-ignore
            axios_1.default.post.mockImplementation(() => {
                return Promise.resolve({
                    response: {
                        status: 204,
                    },
                });
            });
            const fileInfoBufferManager = notificationsService.fileInfoBufferManager;
            const deleteFileInfoBufferSpy = jest.spyOn(fileInfoBufferManager, "deleteFileInfoBuffer");
            fileInfoBufferManager.addToFileInfoBuffer(consumerReference, fileInfo);
            // initial timeout for checking for inactivity
            jest.advanceTimersByTime(fileInfoBufferManager.getTimeoutMilliSeconds());
            yield flushPromises();
            expect(deleteFileInfoBufferSpy).toHaveBeenCalledTimes(1);
            const fileInfoBufferMap = fileInfoBufferManager.getFileInfoBuffer(consumerReference);
            if (!fileInfoBufferMap) {
                fail("fileInfoBufferMap is undefined");
            }
            expect(fileInfoBufferMap.size).toBe(0);
        }));
    });
    describe("handle rejected notification", () => {
        it("delete buffer after retry count exceeded", () => __awaiter(void 0, void 0, void 0, function* () {
            // https://stackoverflow.com/questions/52177631/jest-timer-and-promise-dont-work-well-settimeout-and-async-function/52196951#52196951
            // https://stackoverflow.com/questions/55302069/jest-unit-test-how-do-i-call-through-async-function-in-a-settimeout-repeating
            jest.useFakeTimers();
            // @ts-ignore
            axios_1.default.post.mockImplementation(() => {
                return Promise.reject({
                    response: {
                        status: 408,
                    },
                });
            });
            const fileInfoBufferManager = notificationsService.fileInfoBufferManager;
            const addToFileInfoBufferSpy = jest.spyOn(fileInfoBufferManager, "addToFileInfoBuffer");
            const checkForInactivitySpy = jest.spyOn(fileInfoBufferManager, "checkForInactivityRetry");
            const notifySubscriberWithRetrySpy = jest.spyOn(notificationsService, "notifySubscriberWithRetry");
            const handleRejectedNotificationSpy = jest.spyOn(notificationsService, "handleRejectedNotification");
            const deleteFileInfoBufferSpy = jest.spyOn(fileInfoBufferManager, "deleteFileInfoBuffer");
            fileInfoBufferManager.addToFileInfoBuffer(consumerReference, fileInfo);
            // initial timeout for checking for inactivity
            jest.advanceTimersByTime(fileInfoBufferManager.getTimeoutMilliSeconds());
            yield flushPromises();
            // wait for 60 seconds before first retry
            jest.advanceTimersByTime(notificationsService.retryTimeoutMapping[1]);
            yield flushPromises();
            // wait for 120 seconds before second retry
            jest.advanceTimersByTime(notificationsService.retryTimeoutMapping[2]);
            yield flushPromises();
            // wait for 240 seconds before third retry
            jest.advanceTimersByTime(notificationsService.retryTimeoutMapping[3]);
            yield flushPromises();
            // wait for 600 seconds before fourth retry
            jest.advanceTimersByTime(notificationsService.retryTimeoutMapping[4]);
            yield flushPromises();
            expect(addToFileInfoBufferSpy).toHaveBeenCalledTimes(1);
            expect(checkForInactivitySpy).toHaveBeenCalledTimes(1);
            // notifySubscriberWithRetry should've been called 5 times if we
            // count the first time it was called in checkForInactivity
            expect(notifySubscriberWithRetrySpy).toHaveBeenCalledTimes(4);
            expect(handleRejectedNotificationSpy).toHaveBeenCalledTimes(5);
            expect(deleteFileInfoBufferSpy).toHaveBeenCalledTimes(1);
        }));
        describe("buffer is in retry timeout", () => {
            it("a new file comes in, subscriber should only be notified after retry timeout has finished", () => __awaiter(void 0, void 0, void 0, function* () {
                jest.useFakeTimers();
                const axiosPostSpyOn = jest.spyOn(axios_1.default, "post");
                // @ts-ignore
                axios_1.default.post.mockImplementationOnce(() => {
                    return Promise.reject({
                        response: {
                            status: 408,
                        },
                    });
                });
                // @ts-ignore
                axios_1.default.post.mockImplementationOnce(() => {
                    return Promise.resolve({
                        response: {
                            status: 204,
                        },
                    });
                });
                const fileInfoBufferManager = notificationsService.fileInfoBufferManager;
                const makePostRequestSpy = jest.spyOn(notificationsService, "makePostRequest");
                fileInfoBufferManager.addToFileInfoBuffer(consumerReference, fileInfo);
                // initial timeout for checking for inactivity
                jest.advanceTimersByTime(fileInfoBufferManager.getTimeoutMilliSeconds());
                yield flushPromises();
                // fileInfoBuffer should be in retry timeout
                jest.advanceTimersByTime(5000);
                // add new file to buffer
                const differentFileInfo = {
                    fileLocation: "differentFileLocation",
                    fileReadyTime: new Date().toISOString(),
                    fileDataType: "Analytics",
                };
                fileInfoBufferManager.addToFileInfoBuffer(consumerReference, differentFileInfo);
                jest.advanceTimersByTime(notificationsService.retryTimeoutMapping[1]);
                yield flushPromises();
                jest.runOnlyPendingTimers();
                expect(makePostRequestSpy).toHaveBeenCalledTimes(2);
                // calls[0][0] -> first is the invocation number, second is the argument number
                // first call is with the buffer containing 1 fileInfo,
                // second call is with the buffer containing 2 fileInfos
                // expect the first call to be called with the 1 fileInfo
                expect(makePostRequestSpy.mock.calls[0][1]).toEqual(expect.objectContaining({
                    fileInfoList: expect.arrayContaining([fileInfo]),
                }));
                expect(makePostRequestSpy.mock.calls[1][1]).toEqual(expect.objectContaining({
                    fileInfoList: expect.arrayContaining([
                        fileInfo,
                        differentFileInfo,
                    ]),
                }));
                expect(axiosPostSpyOn).toHaveBeenCalledTimes(2);
                // body should contain 1 fileInfo for the first call
                // body parameter is the second argument in axios.post
                expect(axiosPostSpyOn.mock.calls[0][1]).toEqual(expect.objectContaining({
                    fileInfoList: expect.arrayContaining([fileInfo]),
                }));
                // body should contain 2 fileInfos for the second call
                expect(axiosPostSpyOn.mock.calls[1][1]).toEqual(expect.objectContaining({
                    fileInfoList: expect.arrayContaining([
                        fileInfo,
                        differentFileInfo,
                    ]),
                }));
                // [2024-01-08T22:25:04.028Z] [debug]: Adding file info to buffer for localhost:3000/notifyCallback (FileInfoBufferManagerWithRetry.ts)
                // [2024-01-08T22:25:09.028Z] [debug]: Processing notification for localhost:3000/notifyCallback (FileInfoBufferManagerWithRetry.ts)
                // [2024-01-08T22:25:09.028Z] [debug]: Sending notification: localhost:3000/notifyCallback (NotificationsServiceWithRetry.ts)
                // [2024-01-08T22:25:09.028Z] [debug]: SubscriberNotifyShouldRetryError will retry at 2024-01-08T22:26:09.028Z (NotificationsServiceWithRetry.ts)
                // [2024-01-08T22:25:14.028Z] [debug]: Adding file info to buffer for localhost:3000/notifyCallback (FileInfoBufferManagerWithRetry.ts)
                // [2024-01-08T22:25:14.028Z] [debug]: FileInfoBuffer 452047f5-3625-45c9-88f3-04768aa27012 for localhost:3000/notifyCallback is in retry timeout (FileInfoBufferManagerWithRetry.ts)
                // [2024-01-08T22:26:09.028Z] [debug]: retrying localhost:3000/notifyCallback, retryCount: 1 (NotificationsServiceWithRetry.ts)
                // [2024-01-08T22:26:09.028Z] [debug]: Sending notification: localhost:3000/notifyCallback (NotificationsServiceWithRetry.ts)
                // [2024-01-08T22:26:14.028Z] [info]: notified: {"url":"localhost:3000/notifyCallback","fileInfoBufferKey":"452047f5-3625-45c9-88f3-04768aa27012"} (NotificationsServiceWithRetry.ts)
                // [2024-01-08T22:26:14.028Z] [debug]: Deleting file info buffer [452047f5-3625-45c9-88f3-04768aa27012] for localhost:3000/notifyCallback}] (FileInfoBufferManagerWithRetry.ts)
            }));
            it("new files comes in filling the buffer in timeout, subscriber should only be notified after retry timeout has finished and new buffers should be created for other files", () => __awaiter(void 0, void 0, void 0, function* () {
                var _a;
                jest.useFakeTimers();
                const axiosPostSpyOn = jest.spyOn(axios_1.default, "post");
                // @ts-ignore
                axios_1.default.post.mockImplementationOnce(() => {
                    return Promise.reject({
                        response: {
                            status: 408,
                        },
                    });
                });
                // @ts-ignore
                axios_1.default.post.mockImplementation(() => {
                    return Promise.resolve({
                        response: {
                            status: 204,
                        },
                    });
                });
                const fileInfoBufferManager = notificationsService.fileInfoBufferManager;
                const makePostRequestSpy = jest.spyOn(notificationsService, "makePostRequest");
                const fileInfoList = [];
                fileInfoBufferManager.addToFileInfoBuffer(consumerReference, fileInfo);
                fileInfoList.push(fileInfo);
                // initial timeout for checking for inactivity
                jest.advanceTimersByTime(fileInfoBufferManager.getTimeoutMilliSeconds());
                yield flushPromises();
                // fileInfoBuffer should be in retry timeout
                jest.advanceTimersByTime(5000);
                // add new file to buffer until buffer is full
                const differentFileInfo = {
                    fileLocation: "differentFileLocation",
                    fileReadyTime: new Date().toISOString(),
                    fileDataType: "Analytics",
                };
                for (let i = 0; i < fileInfoBufferManager.getBufferSize() - 1; i++) {
                    fileInfoBufferManager.addToFileInfoBuffer(consumerReference, differentFileInfo);
                    fileInfoList.push(differentFileInfo);
                }
                const inNewBufferFileInfo = {
                    fileLocation: "inNewBufferFileLocation",
                    fileReadyTime: new Date().toISOString(),
                    fileDataType: "Analytics",
                };
                // file should be added to a new buffer
                fileInfoBufferManager.addToFileInfoBuffer(consumerReference, inNewBufferFileInfo);
                const fileInfoBufferMap = fileInfoBufferManager.getFileInfoBuffer(consumerReference);
                if (!fileInfoBufferMap) {
                    fail("fileInfoBufferMap is undefined");
                }
                expect(fileInfoBufferMap).toBeDefined();
                expect(fileInfoBufferMap.size).toBe(2);
                Array.from(fileInfoBufferMap.entries()).forEach(([key, value], index) => {
                    if (index === 0) {
                        expect(value.fileInfos).toEqual(expect.arrayContaining(fileInfoList));
                    }
                    else {
                        expect(value.fileInfos).toEqual(expect.arrayContaining([inNewBufferFileInfo]));
                    }
                });
                (_a = fileInfoBufferManager
                    .getFileInfoBuffer(consumerReference)) === null || _a === void 0 ? void 0 : _a.forEach((value, key) => {
                    console.log(`key: ${key}, value: ${value.fileInfos.length}`);
                });
                jest.advanceTimersByTime(notificationsService.retryTimeoutMapping[1]);
                yield flushPromises();
                jest.runOnlyPendingTimers();
                // 2 calls from the first buffer, 1 call from the second buffer
                expect(makePostRequestSpy).toHaveBeenCalledTimes(3);
                // calls[0][0] -> first is the invocation number, second is the argument number
                // first call is with the buffer containing 1 fileInfo,
                // second call is with the buffer containing 1 fileInfo (inNewBufferFileInfo)
                // -> this is because the buffer from the first call is in retry timeout
                // third call is with the buffer from the first call (which is now full)
                expect(makePostRequestSpy.mock.calls[0][1]).toEqual(expect.objectContaining({
                    fileInfoList: expect.arrayContaining([fileInfo]),
                }));
                expect(makePostRequestSpy.mock.calls[1][1]).toEqual(expect.objectContaining({
                    fileInfoList: expect.arrayContaining([
                        inNewBufferFileInfo,
                    ]),
                }));
                expect(makePostRequestSpy.mock.calls[2][1]).toEqual(expect.objectContaining({
                    fileInfoList: expect.arrayContaining(fileInfoList),
                }));
                expect(axiosPostSpyOn).toHaveBeenCalledTimes(3);
                // body should contain 1 fileInfo for the first call
                // body parameter is the second argument in axios.post
                expect(axiosPostSpyOn.mock.calls[0][1]).toEqual(expect.objectContaining({
                    fileInfoList: expect.arrayContaining([fileInfo]),
                }));
                // body should contain 1 fileInfo for the second call
                expect(axiosPostSpyOn.mock.calls[1][1]).toEqual(expect.objectContaining({
                    fileInfoList: expect.arrayContaining([
                        inNewBufferFileInfo,
                    ]),
                }));
                // body should contain the 10 fileInfos for the third call
                expect(axiosPostSpyOn.mock.calls[2][1]).toEqual(expect.objectContaining({
                    fileInfoList: expect.arrayContaining(fileInfoList),
                }));
            }));
        });
    });
});
