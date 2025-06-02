import { Subscription, SubscriptionDocument } from "../../types/openapi-types";

export interface SubscriptionsDataSource {
	createSubscription(
		subscription: Subscription,
	): Promise<SubscriptionDocument>;
	getSubscription(id: string): Promise<SubscriptionDocument | null>;
	getSubscriptions(filter: object): Promise<SubscriptionDocument[]>;
	deleteSubscription(id: string): Promise<SubscriptionDocument | null>;
}
