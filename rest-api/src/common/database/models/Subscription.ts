import { Schema, model } from "mongoose";
import { Subscription } from "../../types/openapi-types";
export const SubscriptionSchema = new Schema(
	{
		consumerReference: {
			type: String,
			required: true,
		},
		timeTick: Number,
		filter: Object,
	},
	{
		toObject: {
			transform: function (doc, obj) {
				// change subscription ID to string
				if (obj._id) {
					obj._id = obj._id.toString();
				}
				delete obj.__v;
			},
		},
	},
);

export default model<Subscription>("Subscription", SubscriptionSchema);
