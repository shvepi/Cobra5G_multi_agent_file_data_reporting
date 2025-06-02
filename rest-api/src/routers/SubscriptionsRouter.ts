import express from "express";
import mongoose from "mongoose";
import SubscriptionsController from "../controllers/SubscriptionsController";
function checkValidIdMiddleware(req, res, next) {
	// @ts-ignore
	if (!mongoose.isValidObjectId(req.openapi.pathParams.subscriptionId))
		return res
			.status(400)
			.send({ message: "id must be 24 characters long" });
	next();
}

function SubscriptionsRouter(SubscriptionsController: SubscriptionsController) {
	const router = express.Router();
	router.post("/subscriptions", SubscriptionsController.createSubscription);
	router.get(
		"/subscriptions/:id",
		checkValidIdMiddleware,
		SubscriptionsController.getSubscription,
	);
	router.delete(
		"/subscriptions/:id",
		checkValidIdMiddleware,
		SubscriptionsController.deleteSubscription,
	);
	return router;
}

export default SubscriptionsRouter;
