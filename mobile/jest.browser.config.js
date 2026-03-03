/**
 * jest.browser.config.js
 *
 * Jest configuration for ZipBrowser component tests.
 * Uses jest-expo preset which handles React Native's non-standard
 * module syntax ("import typeof") via Babel.
 */
const path = require('path');

module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  rootDir: path.resolve(__dirname),
  roots: ['<rootDir>/src'],
  testMatch: ['<rootDir>/src/components/__tests__/**/*.test.tsx'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react',
          strict: false,
          esModuleInterop: true,
          allowJs: true,
        },
        diagnostics: false,
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      '@react-native|' +
      'react-native|' +
      'react-native-webview|' +
      'react-native-safe-area-context|' +
      '@testing-library' +
    ')/)',
  ],
};
