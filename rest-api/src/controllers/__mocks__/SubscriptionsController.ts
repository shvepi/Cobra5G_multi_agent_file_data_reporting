export default class SubscriptionsController {
	constructor() {}
	createSubscription = jest.fn(async (req, res) => {
		console.log("createSubscription");
		res.sendStatus(400);
	});
	getSubscription = jest.fn(async (req, res) => {
		console.log("getSubscription");
		res.sendStatus(400);
	});
	deleteSubscription = jest.fn(async (req, res) => {
		console.log("deleteSubscription");
		res.sendStatus(400);
	});
}
