/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react', strict: false, esModuleInterop: true }, diagnostics: false }],
  },
  // Transform @testing-library/react-native and react-native (ship as ESM/TS source)
  transformIgnorePatterns: [
    'node_modules/(?!(@testing-library/react-native|react-native|react-native-webview|react-native-safe-area-context)/)',
  ],
  // The SignalingService singleton is mocked via jest.mock() in the test file
};
