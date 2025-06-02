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
Object.defineProperty(exports, "__esModule", { value: true });
class FilesController {
    constructor() {
        this.filesGET = jest.fn((req, res) => __awaiter(this, void 0, void 0, function* () {
            console.log("filesGET");
            res.sendStatus(400);
        }));
        this.filesGETById = jest.fn((req, res) => __awaiter(this, void 0, void 0, function* () {
            console.log("filesGETById");
            res.sendStatus(400);
        }));
        this.filesPOST = jest.fn((req, res) => __awaiter(this, void 0, void 0, function* () {
            console.log("filesPOST");
            res.sendStatus(400);
        }));
        this.filesPOSTMany = jest.fn((req, res) => __awaiter(this, void 0, void 0, function* () {
            console.log("filesPOSTMany");
            res.sendStatus(400);
        }));
        this.filesDELETE = jest.fn((req, res) => __awaiter(this, void 0, void 0, function* () {
            console.log("filesDELETE");
            res.sendStatus(400);
        }));
    }
}
exports.default = FilesController;
