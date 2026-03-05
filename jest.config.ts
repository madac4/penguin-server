import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@scalar/express-api-reference$': '<rootDir>/tests/__mocks__/@scalar/express-api-reference.ts',
  },
  testMatch: ['**/*.test.ts'],
  testTimeout: 15000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
};

export default config;
