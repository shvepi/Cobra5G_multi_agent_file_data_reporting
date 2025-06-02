export default class FilesController {
	constructor() {}
	filesGET = jest.fn(async (req, res) => {
		console.log("filesGET");
		res.sendStatus(400);
	});

	filesGETById = jest.fn(async (req, res) => {
		console.log("filesGETById");
		res.sendStatus(400);
	});

	filesPOST = jest.fn(async (req, res) => {
		console.log("filesPOST");
		res.sendStatus(400);
	});

	filesPOSTMany = jest.fn(async (req, res) => {
		console.log("filesPOSTMany");
		res.sendStatus(400);
	});

	filesDELETE = jest.fn(async (req, res) => {
		console.log("filesDELETE");
		res.sendStatus(400);
	});
}
