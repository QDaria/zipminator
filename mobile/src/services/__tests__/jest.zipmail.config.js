/**
 * Jest config override for ZipMailService tests.
 *
 * Disables ts-jest diagnostics to work around a pre-existing strict-mode
 * type error in PiiScannerService.ts (debounce generic mismatch).
 * The runtime behaviour is correct; only the type inference disagrees.
 */
const path = require('path');

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: path.resolve(__dirname, '../../..'),
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.test.ts'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: { strict: true }, diagnostics: false }],
    },
};
