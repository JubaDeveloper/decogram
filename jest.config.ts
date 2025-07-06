import type { Config } from "jest";
import { createDefaultPreset } from "ts-jest";

const tsJestTransformCfg = createDefaultPreset().transform;


const config: Config = {
	testEnvironment: "node",
	moduleNameMapper: {
		"^metagram@core/(.*)$": "<rootDir>/src/core/$1",
	},
	moduleDirectories: ["node_modules", "src"],
	transform: {
		...tsJestTransformCfg,
	}
};

export default config;