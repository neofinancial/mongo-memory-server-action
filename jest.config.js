module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ["/build/", "/node_modules/"],
  setTimeout: 15000
};