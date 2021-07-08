module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ["/build/", "/node_modules/"],
  testTimeout: 30000
};
