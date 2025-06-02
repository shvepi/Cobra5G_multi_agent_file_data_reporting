import SubscriptionsService from "../services/SubscriptionsService";
import Controller from "./Controller";

export default class SubscriptionsController {
	subscriptionsService: SubscriptionsService;
	constructor(subscriptionsService: SubscriptionsService) {
		this.subscriptionsService = subscriptionsService;
	}
	createSubscription = async (request, response) => {
		await Controller.handleRequest(
			request,
			response,
			this.subscriptionsService.createSubscription,
		);
	};

	getSubscription = async (request, response) => {
		await Controller.handleRequest(
			request,
			response,
			this.subscriptionsService.getSubscription,
		);
	};

	deleteSubscription = async (request, response) => {
		await Controller.handleRequest(
			request,
			response,
			this.subscriptionsService.deleteSubscription,
		);
	};
}
