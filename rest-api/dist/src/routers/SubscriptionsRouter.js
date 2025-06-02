"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
function checkValidIdMiddleware(req, res, next) {
    // @ts-ignore
    if (!mongoose_1.default.isValidObjectId(req.openapi.pathParams.subscriptionId))
        return res
            .status(400)
            .send({ message: "id must be 24 characters long" });
    next();
}
function SubscriptionsRouter(SubscriptionsController) {
    const router = express_1.default.Router();
    router.post("/subscriptions", SubscriptionsController.createSubscription);
    router.get("/subscriptions/:id", checkValidIdMiddleware, SubscriptionsController.getSubscription);
    router.delete("/subscriptions/:id", checkValidIdMiddleware, SubscriptionsController.deleteSubscription);
    return router;
}
exports.default = SubscriptionsRouter;
