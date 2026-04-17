// Jest Configuration for Enhanced Coverage
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests-essential/**/*.test.js',
    '<rootDir>/server/guild/__tests__/**/*.test.js'
  ],
  collectCoverageFrom: [
    'server/**/*.js',
    'client/**/*.js',
    '!client/dist/**',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!server/guild/GuildDatabase.pg.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'json',
    'html',
    'lcov'
  ],
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    },
    './server/world/': {
      branches: 98,
      functions: 98,
      lines: 98,
      statements: 98
    },
    './server/ai/': {
      branches: 97,
      functions: 97,
      lines: 97,
      statements: 97
    },
    './client/game/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './server/guild/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  collectCoverage: true,
  verbose: true,
  testTimeout: 10000,
  maxWorkers: 4,
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache'
};
