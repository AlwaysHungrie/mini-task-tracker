/** @type {import("jest").Config} **/
export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts", "**/?(*.)+(spec|test).ts"],
  moduleFileExtensions: ["ts", "js"],
  extensionsToTreatAsEsm: [".ts"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
  ],
  coverageDirectory: "coverage",
  verbose: false,
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  moduleNameMapper: {
    "^database/(.*)\\.js$": "<rootDir>/src/database/$1.ts",
    "^(?!.*node_modules)(\\.{1,2}/.*)\\.js$": "$1",
  },
  setupFiles: ["<rootDir>/src/__tests__/setup.ts"],
};
