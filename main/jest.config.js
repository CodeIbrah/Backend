module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  transformIgnorePatterns: ['/node_modules/'],
  moduleNameMapper: {
    '^@shared-types$': '<rootDir>/../../packages/shared-types/src',
    '^@shared-utils$': '<rootDir>/../../packages/shared-utils/src',
    '^@shared-logger$': '<rootDir>/../../packages/shared-logger/src',
    '^@shared-telemetry$': '<rootDir>/../../packages/shared-telemetry/src',
    '^@shared-analytics$': '<rootDir>/../../packages/shared-analytics/src',
    '^@shared-ai$': '<rootDir>/../../packages/shared-ai/src',
    '^@shared-reports$': '<rootDir>/../../packages/shared-reports/src',
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};
