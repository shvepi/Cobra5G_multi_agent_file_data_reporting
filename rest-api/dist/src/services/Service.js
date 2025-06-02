"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Service {
    static rejectResponse(error, code = 500) {
        return { error, code };
    }
    static successResponse(payload, code = 200) {
        return { payload, code };
    }
}
exports.default = Service;
