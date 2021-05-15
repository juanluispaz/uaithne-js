module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: '/test/.*\\.spec\\.ts$',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/test/',
    '/exampe/'
  ]
};