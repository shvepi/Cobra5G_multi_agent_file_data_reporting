import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
// @ts-ignore
const urlPort = parseInt(process.env.API_PORT) || 8080;

const config: Record<string, any> = {
	ROOT_DIR: __dirname,
	URL_PORT: urlPort,
	URL_PATH: "http://example.com",
	BASE_VERSION: "/3GPPManagement/fileDataReportingMnS/XXX",
	CONTROLLER_DIRECTORY: path.join(__dirname, "controllers"),
	PROJECT_DIR: __dirname,
};
config.OPENAPI_YAML = path.join(config.ROOT_DIR, "src", "api", "openapi.yaml");
config.FULL_PATH = `${config.URL_PATH}:${config.URL_PORT}/${config.BASE_VERSION}`;
config.FILE_UPLOAD_PATH = path.join(config.PROJECT_DIR, "uploaded_files");

export default config;
