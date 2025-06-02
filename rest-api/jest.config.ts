export default {
	roots: ["<rootDir>/__tests__"],
	testMatch: [
		"**/__tests__/**/*.+(ts|tsx|js)",
		"**/?(*.)+(spec|test).+(ts|tsx|js)",
	],
	transform: {
		"^.+\\.(ts|tsx)$": "ts-jest",
	},
	moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
	modulePathIgnorePatterns: ["fixtures", "__utils__"],
	collectCoverageFrom: ["<rootDir>/src/**/*.ts"],
	verbose: true,
};
