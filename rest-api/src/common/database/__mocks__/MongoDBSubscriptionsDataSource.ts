/* eslint-disable @typescript-eslint/no-unused-vars */

import { Subscription } from "../../types/openapi-types";

import { SubscriptionsDataSource } from "../interfaces/SubscriptionsDataSource";

export default class MongoDBSubscriptionsDataSource
	implements SubscriptionsDataSource
{
	constructor() {}
	createSubscription = jest.fn(async (subscription: Subscription) => {
		console.log("createSubscription: " + JSON.stringify(subscription));
		return {
			_id: "5f8f2b9a0f0b7a1f9c3f4b9b",
			...subscription,
		};
	});

	getSubscription = jest.fn(async (id: string) => {
		return {
			_id: "5f8f2b9a0f0b7a1f9c3f4b9b",
			consumerReference: "127.0.0.1:7777/callback",
		};
	});

	getSubscriptions = jest.fn(async (filter: object) => {
		return [
			{
				_id: "5f8f2b9a0f0b7a1f9c3f4b9b",
				consumerReference: "127.0.0.1:7777/callback",
			},
			{
				// _id should be 24 characters
				_id: "21783947184529d9fa9d2312",
				consumerReference: "127.0.0.1:7778/callback",
			},
		];
	});
	deleteSubscription = jest.fn(async (id: string) => {
		return {
			_id: id,
			consumerReference: "127.0.0.1:7777/callback",
		};
	});
}
