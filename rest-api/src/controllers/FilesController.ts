import FilesService from "../services/FilesService";
import Controller from "./Controller";

export default class FilesController {
	filesService: FilesService;
	constructor(filesService: FilesService) {
		this.filesService = filesService;
	}
	filesGET = async (request, response) => {
		await Controller.handleRequest(
			request,
			response,
			this.filesService.filesGET,
		);
	};

	filesGETById = async (request, response) => {
		await Controller.handleRequest(
			request,
			response,
			this.filesService.filesGETById,
		);
	};
	filesPOST = async (request, response) => {
		await Controller.handleRequest(
			request,
			response,
			this.filesService.filesPOST,
		);
	};

	filesPOSTMany = async (request, response) => {
		await Controller.handleRequest(
			request,
			response,
			this.filesService.filesPOSTMany,
		);
	};

	filesDELETE = async (request, response) => {
		await Controller.handleRequest(
			request,
			response,
			this.filesService.filesDELETE,
		);
	};
}
