/**
 * PiiScannerService tests -- validates the three-layer PII scanning pipeline.
 *
 * Mocking strategy:
 *   - zipminator-crypto native module: mocked to return JSON PII results
 *   - Timers: jest fake timers for debounce testing
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPiiScan = jest.fn();

jest.mock('../../../modules/zipminator-crypto', () => ({
    __esModule: true,
    default: {
        piiScan: mockPiiScan,
    },
}));

// ─── Subject under test ───────────────────────────────────────────────────────

import {
    scanLayer1,
    scanLayer2,
    debounce,
    PiiScannerService,
} from '../PiiScannerService';
import type { PiiMatch, PiiScanResult, PiiSeverity } from '../PiiScannerService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Create a native-format PII match JSON string. */
function makeNativeResult(overrides: Partial<Record<string, unknown>> = {}): string {
    const defaults = {
        pattern_id: 'us_ssn',
        pattern_name: 'US Social Security Number',
        category: 'national_id',
        matched_text: '123-45-6789',
        start: 5,
        end: 16,
        sensitivity: 5,
        country_code: 'us',
    };
    return JSON.stringify([{ ...defaults, ...overrides }]);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PiiScannerService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    // ── Layer 1: Instant critical detection ──────────────────────────────────

    describe('Layer 1 - scanLayer1()', () => {
        it('detects password fields', () => {
            const text = 'My password: SuperSecret123!';
            const matches = scanLayer1(text);

            expect(matches.length).toBeGreaterThanOrEqual(1);
            const pwMatch = matches.find((m) => m.patternId === 'password_field');
            expect(pwMatch).toBeDefined();
            expect(pwMatch!.severity).toBe('CRITICAL');
            expect(pwMatch!.layer).toBe(1);
        });

        it('detects API keys', () => {
            const text = 'api_key=sk_test_FAKE_FOR_PII_SCANNER_TEST';
            const matches = scanLayer1(text);

            const apiMatch = matches.find((m) => m.patternId === 'api_key_generic');
            expect(apiMatch).toBeDefined();
            expect(apiMatch!.severity).toBe('CRITICAL');
            expect(apiMatch!.category).toBe('credential');
        });

        it('detects AWS access keys', () => {
            const text = 'Key: AKIAIOSFODNN7EXAMPLE';
            const matches = scanLayer1(text);

            const awsMatch = matches.find((m) => m.patternId === 'aws_access_key');
            expect(awsMatch).toBeDefined();
            expect(awsMatch!.severity).toBe('CRITICAL');
        });

        it('detects PEM private keys', () => {
            const text = '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAK...';
            const matches = scanLayer1(text);

            const pemMatch = matches.find((m) => m.patternId === 'pem_private_key');
            expect(pemMatch).toBeDefined();
            expect(pemMatch!.severity).toBe('CRITICAL');
        });

        it('detects GitHub tokens', () => {
            const text = 'Token: ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij';
            const matches = scanLayer1(text);

            const ghMatch = matches.find((m) => m.patternId === 'github_token');
            expect(ghMatch).toBeDefined();
        });

        it('detects JWT tokens', () => {
            const text = 'Auth: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
            const matches = scanLayer1(text);

            const jwtMatch = matches.find((m) => m.patternId === 'jwt_token');
            expect(jwtMatch).toBeDefined();
        });

        it('detects Bearer tokens', () => {
            const text = 'Authorization: Bearer eyJhbGciOiJSUzI1NiJ9.abc.def';
            const matches = scanLayer1(text);

            const bearerMatch = matches.find((m) => m.patternId === 'bearer_token');
            expect(bearerMatch).toBeDefined();
        });

        it('returns empty for innocuous text', () => {
            const text = 'Hello, how are you today? The weather is nice.';
            const matches = scanLayer1(text);

            expect(matches).toEqual([]);
        });

        it('returns correct match positions', () => {
            const text = 'my password: secret123';
            const matches = scanLayer1(text);

            const pwMatch = matches.find((m) => m.patternId === 'password_field');
            expect(pwMatch).toBeDefined();
            expect(text.slice(pwMatch!.start, pwMatch!.end)).toContain('password');
        });

        it('detects multiple patterns in same text', () => {
            const text = 'password=secret api_key=AKIAIOSFODNN7EXAMPLE';
            const matches = scanLayer1(text);

            expect(matches.length).toBeGreaterThanOrEqual(2);
        });

        it('all Layer 1 matches have countryCode null', () => {
            const text = 'password: test123 api_key: sk_1234567890abcdef';
            const matches = scanLayer1(text);

            for (const m of matches) {
                expect(m.countryCode).toBeNull();
            }
        });
    });

    // ── Layer 2: Native module scan ──────────────────────────────────────────

    describe('Layer 2 - scanLayer2()', () => {
        it('calls native piiScan and parses results', async () => {
            mockPiiScan.mockResolvedValue(makeNativeResult());

            const matches = await scanLayer2('SSN: 123-45-6789');

            expect(mockPiiScan).toHaveBeenCalledWith(
                'SSN: 123-45-6789',
                ['us', 'uk', 'ae'],
            );
            expect(matches.length).toBe(1);
            expect(matches[0].patternId).toBe('us_ssn');
            expect(matches[0].layer).toBe(2);
        });

        it('maps sensitivity 5 to CRITICAL severity', async () => {
            mockPiiScan.mockResolvedValue(makeNativeResult({ sensitivity: 5 }));
            const matches = await scanLayer2('test');
            expect(matches[0].severity).toBe('CRITICAL');
        });

        it('maps sensitivity 4 to HIGH severity', async () => {
            mockPiiScan.mockResolvedValue(makeNativeResult({ sensitivity: 4 }));
            const matches = await scanLayer2('test');
            expect(matches[0].severity).toBe('HIGH');
        });

        it('maps sensitivity 3 to MEDIUM severity', async () => {
            mockPiiScan.mockResolvedValue(makeNativeResult({ sensitivity: 3 }));
            const matches = await scanLayer2('test');
            expect(matches[0].severity).toBe('MEDIUM');
        });

        it('maps sensitivity 1-2 to LOW severity', async () => {
            mockPiiScan.mockResolvedValue(makeNativeResult({ sensitivity: 2 }));
            const matches = await scanLayer2('test');
            expect(matches[0].severity).toBe('LOW');
        });

        it('passes custom countries to native module', async () => {
            mockPiiScan.mockResolvedValue('[]');
            await scanLayer2('test', ['us']);
            expect(mockPiiScan).toHaveBeenCalledWith('test', ['us']);
        });

        it('returns empty array on native module error', async () => {
            mockPiiScan.mockRejectedValue(new Error('Native module not available'));
            const matches = await scanLayer2('test');
            expect(matches).toEqual([]);
        });

        it('returns empty array when piiScan returns empty JSON', async () => {
            mockPiiScan.mockResolvedValue('[]');
            const matches = await scanLayer2('no pii here');
            expect(matches).toEqual([]);
        });
    });

    // ── Debounce utility ─────────────────────────────────────────────────────

    describe('debounce()', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('delays execution by the specified time', async () => {
            const fn = jest.fn().mockResolvedValue('result');
            const debounced = debounce(fn, 200);

            const promise = debounced();

            expect(fn).not.toHaveBeenCalled();

            jest.advanceTimersByTime(200);
            const result = await promise;

            expect(fn).toHaveBeenCalledTimes(1);
            expect(result).toBe('result');
        });

        it('cancels previous call when called again within delay', async () => {
            const fn = jest.fn().mockResolvedValue('result');
            const debounced = debounce(fn, 200);

            const promise1 = debounced();
            jest.advanceTimersByTime(100);
            const promise2 = debounced();

            // First promise resolves with undefined (cancelled)
            const result1 = await promise1;
            expect(result1).toBeUndefined();

            jest.advanceTimersByTime(200);
            const result2 = await promise2;

            expect(fn).toHaveBeenCalledTimes(1);
            expect(result2).toBe('result');
        });

        it('passes arguments through to the wrapped function', async () => {
            const fn = jest.fn().mockResolvedValue(null);
            const debounced = debounce(fn, 100);

            const promise = debounced('arg1', 'arg2');
            jest.advanceTimersByTime(100);
            await promise;

            expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
        });
    });

    // ── PiiScannerService integration ────────────────────────────────────────

    describe('PiiScannerService', () => {
        it('fires callback immediately for Layer 1 matches', () => {
            const scanner = new PiiScannerService({
                enableNativeScan: false,
                enableNerScan: false,
            });

            const results: PiiScanResult[] = [];
            scanner.onResult((r) => results.push(r));

            scanner.scan('my password: secret123');

            expect(results.length).toBe(1);
            expect(results[0].maxSeverity).toBe('CRITICAL');
            expect(results[0].matches.some((m) => m.patternId === 'password_field')).toBe(true);

            scanner.destroy();
        });

        it('does not fire callback for Layer 1 when no critical PII found', () => {
            const scanner = new PiiScannerService({
                enableNativeScan: false,
                enableNerScan: false,
            });

            const results: PiiScanResult[] = [];
            scanner.onResult((r) => results.push(r));

            scanner.scan('Hello, good morning!');

            expect(results.length).toBe(0);

            scanner.destroy();
        });

        it('sets pending=true when native scan is enabled', () => {
            const scanner = new PiiScannerService({
                enableNativeScan: true,
                enableNerScan: false,
            });

            const results: PiiScanResult[] = [];
            scanner.onResult((r) => results.push(r));

            scanner.scan('password: test123');

            expect(results.length).toBe(1);
            expect(results[0].pending).toBe(true);

            scanner.destroy();
        });

        it('offResult removes callback', () => {
            const scanner = new PiiScannerService({
                enableNativeScan: false,
            });

            const results: PiiScanResult[] = [];
            const cb = (r: PiiScanResult) => results.push(r);

            scanner.onResult(cb);
            scanner.offResult(cb);

            scanner.scan('password: test123');

            expect(results.length).toBe(0);

            scanner.destroy();
        });

        it('destroy clears all state', () => {
            const scanner = new PiiScannerService({
                enableNativeScan: false,
            });

            const results: PiiScanResult[] = [];
            scanner.onResult((r) => results.push(r));

            scanner.destroy();
            scanner.scan('password: test123');

            expect(results.length).toBe(0);
        });
    });

    // ── PII category classification ──────────────────────────────────────────

    describe('PII category classification', () => {
        it('classifies passwords as credential category', () => {
            const matches = scanLayer1('password=mysecret');
            const pwMatch = matches.find((m) => m.patternId === 'password_field');
            expect(pwMatch?.category).toBe('credential');
        });

        it('classifies API keys as credential category', () => {
            const matches = scanLayer1('api_key=sk_test_FAKE_FOR_SCAN_TEST_X');
            const apiMatch = matches.find((m) => m.patternId === 'api_key_generic');
            expect(apiMatch?.category).toBe('credential');
        });

        it('classifies AWS keys as credential category', () => {
            const matches = scanLayer1('AKIAIOSFODNN7EXAMPLE');
            const awsMatch = matches.find((m) => m.patternId === 'aws_access_key');
            expect(awsMatch?.category).toBe('credential');
        });

        it('classifies PEM keys as credential category', () => {
            const matches = scanLayer1('-----BEGIN PRIVATE KEY-----');
            const pemMatch = matches.find((m) => m.patternId === 'pem_private_key');
            expect(pemMatch?.category).toBe('credential');
        });

        it('Layer 2 maps national_id category from native results', async () => {
            mockPiiScan.mockResolvedValue(makeNativeResult({ category: 'national_id' }));
            const matches = await scanLayer2('test');
            expect(matches[0].category).toBe('national_id');
        });

        it('Layer 2 maps financial category from native results', async () => {
            mockPiiScan.mockResolvedValue(
                makeNativeResult({
                    pattern_id: 'us_credit_card',
                    category: 'financial',
                    sensitivity: 5,
                }),
            );
            const matches = await scanLayer2('test');
            expect(matches[0].category).toBe('financial');
        });
    });
});
