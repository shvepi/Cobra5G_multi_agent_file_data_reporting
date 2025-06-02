import { Schema, model } from "mongoose";
import { FileInfo } from "../../types/openapi-types";

export const FileInfoSchema = new Schema(
	{
		fileLocation: {
			type: String,
			required: true,
		},
		fileSize: Number,
		/** Format: date-time */
		fileReadyTime: Date,
		/** Format: date-time */
		fileExpirationTime: Date,
		fileCompression: String,
		fileFormat: String,
		fileDataType: {
			type: String,
			enum: ["Performance", "Trace", "Analytics", "Proprietary"],
			required: true,
		},
	},
	{
		toObject: {
			transform: function (doc, obj) {
				// change file ID to string
				if (obj._id) {
					obj._id = obj._id.toString();
				}

				delete obj.__v;
			},
		},
	},
);

export default model<FileInfo>("FileInfo", FileInfoSchema);
