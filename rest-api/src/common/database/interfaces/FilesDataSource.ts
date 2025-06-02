import {
	FileInfo,
	AddFile,
	FilesGETQueryParams,
	FileDocument,
} from "../../types/openapi-types";

export interface FilesDataSource {
	createFile(file: AddFile): Promise<FileDocument>;
	createFiles(files: AddFile[]): Promise<FileDocument[]>;
	getFile(id: string): Promise<FileDocument | null>;
	getFileInfo(filterObj: FilesGETQueryParams): Promise<FileInfo[]>;
	deleteFile(id: string): Promise<FileDocument | null>;
}
