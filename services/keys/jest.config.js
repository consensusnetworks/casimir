module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  testTimeout: 50000,
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  }
}