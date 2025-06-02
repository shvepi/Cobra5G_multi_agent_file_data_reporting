import { Schema, model, Types } from "mongoose";
export const FileSchema = new Schema(
	{
		_id: Types.ObjectId,
		fileInfo: {
			type: Types.ObjectId,
			ref: "FileInfo",
		},
	},
	{
		strict: false,
		toObject: {
			transform: function (doc, obj) {
				// change file ID to string
				if (obj._id) {
					obj._id = obj._id.toString();
				}

				if (obj.fileInfo) {
					// change fileInfo ID to string
					if (obj.fileInfo instanceof Types.ObjectId) {
						obj.fileInfo = obj.fileInfo.toString();
					}
				}

				delete obj.__v;
			},
		},
	},
);

export default model("File", FileSchema);
