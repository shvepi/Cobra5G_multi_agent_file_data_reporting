import { transports, createLogger, format } from "winston";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const customFormat = format.printf((options) => {
	let str = `[${options.timestamp}] [${options.level}]: ${options.message}`;
	if (process.env.LOG_LEVEL == "debug") str += ` (${options.moduleName})`;
	return str;
});

const logger = createLogger({
	transports: [
		new transports.Console({
			level: process.env.LOG_LEVEL || "info",
			format: format.combine(
				format.timestamp(),
				format.colorize(),
				customFormat,
			),
		}),
	],
});

if (process.env.NODE_ENV == "production") {
	logger.add(
		new transports.File({
			filename: "error.log",
			level: "error",
			format: format.combine(
				format.timestamp(),
				format.uncolorize(),
				format.json(),
			),
		}),
	);
	logger.add(
		new transports.File({
			filename: "combined.log",
			format: format.combine(
				format.timestamp(),
				format.uncolorize(),
				format.json(),
			),
		}),
	);
}

export default function (name: string) {
	const fileName = path.basename(name);
	return logger.child({ moduleName: fileName });
}
