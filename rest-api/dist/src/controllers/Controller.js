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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const camelcase_1 = __importDefault(require("camelcase"));
const config_1 = __importDefault(require("../../config"));
const customErrors_1 = require("../common/types/customErrors");
class Controller {
    static sendResponse(response, payload) {
        /**
         * The default response-code is 200. We want to allow to change that. in That case,
         * payload will be an object consisting of a code and a payload. If not customized
         * send 200 and the payload as received in this method.
         */
        if (payload.payload.setHeader) {
            const headers = payload.payload.setHeader;
            for (const headerKey of Object.keys(headers)) {
                response.setHeader(headerKey, headers[headerKey]);
            }
            delete payload.payload.setHeader;
        }
        response.status(payload.code || 200);
        const responsePayload = payload.payload !== undefined ? payload.payload : payload;
        if (responsePayload instanceof Object) {
            response.json(responsePayload);
        }
        else {
            response.end(responsePayload);
        }
    }
    static sendError(response, error) {
        response.status(error.code || 500);
        if (error.error instanceof Object) {
            response.json(error.error);
        }
        else {
            response.end(error.error || error.message);
        }
    }
    /**
     * Files have been uploaded to the directory defined by config.js as upload directory
     * Files have a temporary name, that was saved as 'filename' of the file object that is
     * referenced in request.files array.
     * This method finds the file and changes it to the file name that was originally called
     * when it was uploaded. To prevent files from being overwritten, a timestamp is added between
     * the filename and its extension
     * @param request
     * @param fieldName
     * @returns {string}
     */
    static collectFile(request, fieldName) {
        let uploadedFileName = "";
        if (request.files && request.files.length > 0) {
            const fileObject = request.files.find((file) => file.fieldname === fieldName);
            if (fileObject) {
                const fileArray = fileObject.originalname.split(".");
                const extension = fileArray.pop();
                fileArray.push(`_${Date.now()}`);
                uploadedFileName = `${fileArray.join("")}.${extension}`;
                fs_1.default.renameSync(path_1.default.join(config_1.default.FILE_UPLOAD_PATH, fileObject.filename), path_1.default.join(config_1.default.FILE_UPLOAD_PATH, uploadedFileName));
            }
        }
        return uploadedFileName;
    }
    static getRequestBodyName(request) {
        const codeGenDefinedBodyName = request.openapi.schema["x-codegen-request-body-name"];
        if (codeGenDefinedBodyName !== undefined) {
            return codeGenDefinedBodyName;
        }
        const refObjectPath = request.openapi.schema.requestBody.content["application/json"]
            .schema.$ref;
        if (refObjectPath !== undefined && refObjectPath.length > 0) {
            return refObjectPath.substr(refObjectPath.lastIndexOf("/") + 1);
        }
        return "body";
    }
    static collectRequestParams(request) {
        const requestParams = {};
        if (request.openapi.schema.requestBody !== null) {
            const { content } = request.openapi.schema.requestBody;
            if (content["application/json"] !== undefined) {
                const requestBodyName = (0, camelcase_1.default)(this.getRequestBodyName(request));
                requestParams[requestBodyName] = request.body;
            }
            else if (content["multipart/form-data"] !== undefined) {
                Object.keys(content["multipart/form-data"].schema.properties).forEach((property) => {
                    const propertyObject = content["multipart/form-data"].schema.properties[property];
                    if (propertyObject.format !== undefined &&
                        propertyObject.format === "binary") {
                        requestParams[property] = this.collectFile(request, property);
                    }
                    else {
                        requestParams[property] = request.body[property];
                    }
                });
            }
        }
        if (request.openapi.schema.parameters !== undefined) {
            request.openapi.schema.parameters.forEach((param) => {
                if (param.in === "path") {
                    requestParams[param.name] =
                        request.openapi.pathParams[param.name];
                }
                else if (param.in === "query") {
                    requestParams[param.name] = request.query[param.name];
                }
                else if (param.in === "header") {
                    requestParams[param.name] = request.headers[param.name];
                }
            });
        }
        return requestParams;
    }
    static handleRequest(request, response, serviceOperation) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const serviceResponse = yield serviceOperation(this.collectRequestParams(request));
                if (serviceResponse.error) {
                    throw new customErrors_1.ErrorResponse(serviceResponse.error, serviceResponse.code);
                }
                Controller.sendResponse(response, serviceResponse);
            }
            catch (error) {
                Controller.sendError(response, error);
            }
        });
    }
}
exports.default = Controller;
