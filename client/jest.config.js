/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  //setupFilesAfterEnv: ['<rootDir>/jest.setupFilesAfterEnv.ts'],
  moduleNameMapper: {
    '^react-dom/client$': 'react-dom',
  }
};