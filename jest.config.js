module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/*.test.js'],
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  transform: {},
  coverageProvider: 'v8'
};
