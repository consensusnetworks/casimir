module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  testTimeout: 20000,
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  verbose: true
}
