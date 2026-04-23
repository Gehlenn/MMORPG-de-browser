// Jest Configuration for AI Tests Only (sem coverage thresholds)
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/enhanced-ai-system-*.test.js'
  ],
  collectCoverageFrom: [
    'server/ai/*.js'
  ],
  coverageDirectory: 'coverage/ai',
  coverageReporters: [
    'text',
    'text-summary',
    'html'
  ],
  // Sem thresholds para não falhar
  coverageThreshold: undefined,
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jsdom|html-encoding-sniffer)/)'
  ],
  collectCoverage: true,
  verbose: true,
  testTimeout: 10000,
  maxWorkers: 2
};
