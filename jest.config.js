const { defaults } = require("jest-config");

module.exports = {
  testEnvironment: "node",
  preset: "ts-jest",
  testMatch: null,
  testRegex: "/__tests__/.*\\.test\\.(js|ts)$",
  testPathIgnorePatterns: [
    "/node_modules/",
    "/lib/"
  ],
  moduleFileExtensions: [...defaults.moduleFileExtensions, "ts", "tsx"],
  clearMocks: true,
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.json",
      diagnostics: false
    }
  }
};
