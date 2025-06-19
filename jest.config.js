export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/templates/',
    '/examples/'
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'es2022',
        target: 'es2022',
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true
      }
    }],
    '^.+\\.jsx?$': ['ts-jest', {
      useESM: true
    }]
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(chalk|ora|cli-table3|inquirer|ansi-styles|strip-ansi|ansi-regex|string-width|is-unicode-supported|figures|log-symbols|is-interactive|supports-color|has-flag|ansi-escapes|run-async|rxjs|tslib)/)'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  globals: {},
  maxWorkers: '50%',
  forceExit: true,
  detectOpenHandles: true
};