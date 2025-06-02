import {
	Subscription as ISubscription,
	SubscriptionDocument,
} from "../types/openapi-types";
import Subscription from "./models/Subscription";
import { SubscriptionsDataSource } from "./interfaces/SubscriptionsDataSource";
import logger from "../logger";

const Logger = logger(__filename);

export default class MongoDBSubscriptionsDataSource
	implements SubscriptionsDataSource
{
	constructor() {}
	async createSubscription(
		subscription: ISubscription,
	): Promise<SubscriptionDocument> {
		const newSubscription = new Subscription({
			...subscription,
		});
		await newSubscription.save();
		Logger.debug(`new subscription: ${newSubscription}`);
		const subscriptionDoc: SubscriptionDocument =
			newSubscription.toObject();

		// TS 28.532 12.2.1.1.8
		// return Subscription data type
		return subscriptionDoc;
	}

	async getSubscription(id: string): Promise<SubscriptionDocument | null> {
		// keep select without -_id, to test getSubscription
		const subscription = await Subscription.findOne({ _id: id }).select(
			"-__v",
		);
		Logger.debug(`subscription: ${subscription}`);
		if (!subscription) return null;
		const subscriptionDoc: SubscriptionDocument = subscription.toObject();
		return subscriptionDoc;
	}

	async getSubscriptions(filter: object): Promise<SubscriptionDocument[]> {
		const subscriptions = await Subscription.find(filter).select("-__v");
		const subscriptionDocs: SubscriptionDocument[] = subscriptions.map(
			(sub) => sub.toObject(),
		);
		Logger.debug(`subscriptions: ${subscriptions}`);
		return subscriptionDocs;
	}

	async deleteSubscription(id: string): Promise<SubscriptionDocument | null> {
		const subscription = await Subscription.findOneAndDelete({
			_id: id,
		}).select("-__v");
		Logger.debug(`subscription: ${subscription}`);
		if (!subscription) return null;
		const subscriptionDoc: SubscriptionDocument = subscription.toObject();
		return subscriptionDoc;
	}
}
