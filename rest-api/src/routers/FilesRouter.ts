import express from "express";
import mongoose from "mongoose";
import FilesController from "../controllers/FilesController";

function checkValidIdMiddleware(req, res, next) {
	// @ts-ignore
	if (!mongoose.isValidObjectId(req.openapi.pathParams.fileId)) {
		return res
			.status(400)
			.send({ message: "id must be 24 characters long" });
	}
	next();
}

function FilesRouter(FilesController: FilesController) {
	const router = express.Router();
	router.get("/files", FilesController.filesGET);
	router.get(
		"/files/:id",
		checkValidIdMiddleware,
		FilesController.filesGETById,
	);
	router.post("/files", FilesController.filesPOST);
	router.post("/files/create_many", FilesController.filesPOSTMany);
	router.delete(
		"/files/:id",
		checkValidIdMiddleware,
		FilesController.filesDELETE,
	);
	return router;
}

export default FilesRouter;
