import config from "../../../config";
import mongoose from "mongoose";
import {
	FileInfo as IFileInfo,
	AddFile,
	FilesGETQueryParams,
	FileDocument,
} from "../types/openapi-types";
import FileInfo from "./models/FileInfo";
import File from "./models/File";
import { FilesDataSource } from "./interfaces/FilesDataSource";
import logger from "../logger";

const Logger = logger(__filename);

export default class MongoDBFilesDataSource implements FilesDataSource {
	constructor() {}
	async createFile(file: AddFile): Promise<FileDocument> {
		const { fileContent, ...fileInfoFields } = file;
		const newFile = new File({
			_id: new mongoose.Types.ObjectId(),
			...fileContent,
		});
		await newFile.save();
		const newFileId = newFile._id;

		const newFileInfo = new FileInfo({
			...fileInfoFields,
			fileLocation:
				"http://localhost:" +
				config.URL_PORT +
				"/fileDataReportingMnS/v1/files/" +
				newFileId,
		});
		await newFileInfo.save();

		// keep fileInfo: newFileInfo, not newFileInfo._id
		// newFileDoc.fileInfo will not be populated
		newFile.set({ fileInfo: newFileInfo });
		await newFile.save();
		Logger.debug(`new file: ${newFile}`);
		const newFileDoc: FileDocument = newFile.toObject();

		return newFileDoc;
	}
	async createFiles(files: AddFile[]): Promise<FileDocument[]> {
		const fileInfos: FileDocument[] = [];
		for (const file of files) {
			const { fileContent, ...fileInfoFields } = file;
			const newFile = new File({
				_id: new mongoose.Types.ObjectId(),
				...fileContent,
			});
			await newFile.save();
			const newFileId = newFile._id;

			const newFileInfo = new FileInfo({
				...fileInfoFields,
				fileLocation:
					"http://localhost:" +
					config.URL_PORT +
					"/fileDataReportingMnS/v1/files/" +
					newFileId,
			});
			await newFileInfo.save();
			newFile.set({ fileInfo: newFileInfo });
			await newFile.save();
			Logger.debug(`new file: ${newFile}`);
			fileInfos.push(newFile.toObject());
		}
		return fileInfos;
	}
	async getFile(id: string): Promise<FileDocument | null> {
		const file = await File.findOne({ _id: id })
			.populate({
				path: "fileInfo",
				select: "-__v",
			})
			.select("-__v");
		Logger.debug(`file: ${file}`);
		if (!file) return null;

		const fileDoc: FileDocument = file.toObject();
		return fileDoc;
	}
	async getFileInfo(filter: FilesGETQueryParams): Promise<IFileInfo[]> {
		const fileInfos = await FileInfo.find({
			fileDataType: filter["fileDataType"],
			...((filter["beginTime"] || filter["endTime"]) && {
				fileReadyTime: {
					...(filter["beginTime"] && {
						$gte: filter["beginTime"],
					}),
					...(filter["endTime"] && {
						$lte: filter["endTime"],
					}),
				},
			}),
		}).select("-__v -_id");
		Logger.debug(`fileInfos: ${fileInfos}`);
		return fileInfos;
	}
	async deleteFile(id: string) {
		const file = await File.findOneAndDelete({ _id: id })
			.populate({
				path: "fileInfo",
				select: "-__v",
			})
			.select("-__v");
		Logger.debug(`file: ${file}`);
		if (!file) return null;
		if (!file.fileInfo) return null;

		await FileInfo.findOneAndDelete({ _id: file.fileInfo });

		const fileDoc: FileDocument = file.toObject();
		return fileDoc;
	}
}
