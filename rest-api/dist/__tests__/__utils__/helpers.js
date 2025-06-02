"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkFileInfoEquality = void 0;
function checkFileInfoEquality(received, expected) {
    for (const key of Object.keys(received)) {
        if (key === "fileReadyTime" || key === "fileExpirationTime") {
            expect(new Date(received[key]).getTime() ===
                new Date(expected[key]).getTime()).toBe(true);
            continue;
        }
        expect(received[key]).toBe(expected[key]);
    }
}
exports.checkFileInfoEquality = checkFileInfoEquality;
