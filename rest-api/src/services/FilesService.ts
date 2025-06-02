/* eslint-disable no-unused-vars */
import Service from "./Service";
import {
	FilesGETQueryParams,
	FilesGETResponses,
	FilesPOSTManyResponses,
	FilesPOSTResponses,
	FileInfo,
	FilesDeleteResponses,
	FileDocument,
} from "../common/types/openapi-types";
import { FilesDataSource } from "../common/database/interfaces/FilesDataSource";
import NotificationsService from "./NotificationsService";
import NotificationsServiceWithRetry from "./retryNotifications/NotificationsServiceWithRetry";
import logger from "../common/logger";

const Logger = logger(__filename);

class FilesService {
	filesDataSource: FilesDataSource;
	notificationsService?: NotificationsService | NotificationsServiceWithRetry;

	constructor(
		filesDataSource: FilesDataSource,
		notificationsService?:
			| NotificationsService
			| NotificationsServiceWithRetry,
	) {
		this.filesDataSource = filesDataSource;
		if (notificationsService) {
			this.notificationsService = notificationsService;
		}
	}

	filesGET = async (filesGETQueryParams: FilesGETQueryParams) => {
		const files =
			await this.filesDataSource.getFileInfo(filesGETQueryParams);

		const response: FileInfo[] = files;

		try {
			return Service.successResponse(response);
		} catch (e) {
			const errorResponse: FilesGETResponses["default"]["content"]["application/json"] =
				{
					error: {
						// @ts-ignore
						errorInfo: e.message,
					},
				};
			return Service.rejectResponse(errorResponse.error, 400);
		}
	};

	filesGETById = async ({ fileId }) => {
		const file = await this.filesDataSource.getFile(fileId);
		try {
			if (!file)
				return Service.rejectResponse(
					{
						error: {
							errorInfo: `file with id: ${fileId} not found`,
						},
					},
					404,
				);
			const fileResponse = this.formatFileResponse(file);
			return Service.successResponse(fileResponse);
		} catch (e) {
			const errorResponse: FilesGETResponses["default"]["content"]["application/json"] =
				{
					error: {
						// @ts-ignore
						errorInfo: e.message,
					},
				};
			return Service.rejectResponse(errorResponse.error, 400);
		}
	};

	filesPOST = async ({ body }) => {
		const file = body;
		if (!file.fileContent || !file.fileDataType) {
			let missingAttr = "";
			if (!file.fileContent) missingAttr += "fileContent";
			if (!file.fileDataType)
				missingAttr += missingAttr
					? " and fileDataType"
					: "fileDataType";
			const errorResponse: FilesGETResponses["default"]["content"]["application/json"] =
				{
					error: {
						// @ts-ignore
						errorInfo: `request body should contain ${missingAttr}`,
					},
				};
			return Service.rejectResponse(errorResponse);
		}
		const newFile = await this.filesDataSource.createFile(file);

		// notify subscribers of new file
		this.sendFileCreatedEvent(newFile);

		const id = newFile._id;
		const response: FilesPOSTResponses["201"]["content"]["application/json"] =
			{
				fileId: id,
			};

		try {
			return Service.successResponse(response, 201);
		} catch (e) {
			const errorResponse: FilesGETResponses["default"]["content"]["application/json"] =
				{
					error: {
						// @ts-ignore
						errorInfo: e.message,
					},
				};
			return Service.rejectResponse(errorResponse.error, 400);
		}
	};

	filesPOSTMany = async ({ body }) => {
		const files = body;
		const newFiles = await this.filesDataSource.createFiles(files);

		// notify subscribers of new files
		for (const file of newFiles) {
			this.sendFileCreatedEvent(file);
		}

		const ids = newFiles.map((file) => file._id);
		const response: FilesPOSTManyResponses["201"]["content"]["application/json"] =
			ids;
		try {
			return Service.successResponse(response, 201);
		} catch (e) {
			const errorResponse: FilesGETResponses["default"]["content"]["application/json"] =
				{
					error: {
						// @ts-ignore
						errorInfo: e.message,
					},
				};
			return Service.rejectResponse(errorResponse.error, 400);
		}
	};

	filesPUT = async ({ subscription }) => {
		try {
			Service.successResponse({
				subscription,
			});
		} catch (e) {
			Service.rejectResponse(
				// @ts-ignore
				e.message || "Invalid input",
				// @ts-ignore
				e.status || 405,
			);
		}
	};

	filesDELETE = async ({ fileId }) => {
		const file = await this.filesDataSource.deleteFile(fileId);
		if (!file) {
			return Service.rejectResponse(
				{
					error: {
						errorInfo: `file with ID: ${fileId} not found`,
					},
				},
				404,
			);
		}
		const fileResponse = this.formatFileResponse(file);

		const response: FilesDeleteResponses["200"]["content"]["application/json"] =
			fileResponse;
		try {
			return Service.successResponse(response);
		} catch (e) {
			return Service.rejectResponse(
				// @ts-ignore
				e.message || "Invalid input",
				// @ts-ignore
				e.status || 405,
			);
		}
	};

	sendFileCreatedEvent = async (file: FileDocument) => {
		if (this.notificationsService) {
			this.notificationsService.fileCreatedEmitter.emit(
				"fileCreated",
				file,
			);
			Logger.debug("fileCreated event emitted");
		}
	};

	formatFileResponse = (file: FileDocument) => {
		const { fileInfo, ...f } = file;
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { _id, ...fileInfoWithoutId } = fileInfo;
		f.fileInfo = fileInfoWithoutId;

		return {
			...f,
			fileInfo: fileInfoWithoutId,
		};
	};
}

export default FilesService;
