module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*..spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  globals: { "ts-jest": { "tsconfig": "tsconfig.build.json" } },
};