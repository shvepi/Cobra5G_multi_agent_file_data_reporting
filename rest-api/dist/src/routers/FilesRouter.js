"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
function checkValidIdMiddleware(req, res, next) {
    // @ts-ignore
    if (!mongoose_1.default.isValidObjectId(req.openapi.pathParams.fileId)) {
        return res
            .status(400)
            .send({ message: "id must be 24 characters long" });
    }
    next();
}
function FilesRouter(FilesController) {
    const router = express_1.default.Router();
    router.get("/files", FilesController.filesGET);
    router.get("/files/:id", checkValidIdMiddleware, FilesController.filesGETById);
    router.post("/files", FilesController.filesPOST);
    router.post("/files/create_many", FilesController.filesPOSTMany);
    router.delete("/files/:id", checkValidIdMiddleware, FilesController.filesDELETE);
    return router;
}
exports.default = FilesRouter;
