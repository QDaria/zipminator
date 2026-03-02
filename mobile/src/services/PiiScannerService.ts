/**
 * PiiScannerService — Three-layer PII detection pipeline for email compose.
 *
 * Architecture:
 *   Layer 1 (Instant):   Hardcoded critical patterns — passwords, API keys, PEM blocks.
 *                         Runs synchronously on every keystroke.
 *   Layer 2 (Debounced):  Full pattern scan via native Rust module (JSI bridge).
 *                         Runs after 200ms debounce.
 *   Layer 3 (Deep/NER):   Placeholder for NER-based entity recognition.
 *                         Interface defined; implementation deferred.
 *
 * @module PiiScannerService
 */

// ── Types ────────────────────────────────────────────────────────────────────

/** Severity levels for PII detections. */
export type PiiSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

/** A single PII match from any scanning layer. */
export interface PiiMatch {
    /** Pattern identifier (e.g. "api_key", "us_ssn") */
    patternId: string;
    /** Human-readable pattern name */
    patternName: string;
    /** PII category (e.g. "credential", "national_id", "financial") */
    category: string;
    /** The matched substring */
    matchedText: string;
    /** Start offset in the scanned text */
    start: number;
    /** End offset in the scanned text */
    end: number;
    /** Detection severity */
    severity: PiiSeverity;
    /** Country code (null for country-agnostic patterns like API keys) */
    countryCode: string | null;
    /** Which layer detected this match (1, 2, or 3) */
    layer: 1 | 2 | 3;
}

/** Aggregate result from the scanning pipeline. */
export interface PiiScanResult {
    /** All matches found across all layers */
    matches: PiiMatch[];
    /** Highest severity found (null if no matches) */
    maxSeverity: PiiSeverity | null;
    /** Whether the scan is still pending deeper layers */
    pending: boolean;
    /** Timestamp of the scan */
    timestamp: number;
}

// ── Layer 1: Instant Critical Pattern Detection ──────────────────────────────

interface CriticalPattern {
    id: string;
    name: string;
    regex: RegExp;
    severity: PiiSeverity;
    category: string;
}

/**
 * Hardcoded critical patterns that must be detected instantly on every
 * keystroke. These are country-agnostic credential/secret patterns.
 */
const CRITICAL_PATTERNS: CriticalPattern[] = [
    {
        id: 'password_field',
        name: 'Password in Text',
        regex: /(?:password|passwd|pwd)\s*[:=]\s*\S+/gi,
        severity: 'CRITICAL',
        category: 'credential',
    },
    {
        id: 'api_key_generic',
        name: 'API Key',
        regex: /(?:api[_-]?key|apikey|api[_-]?secret)\s*[:=]\s*['"]?[A-Za-z0-9_\-]{16,}['"]?/gi,
        severity: 'CRITICAL',
        category: 'credential',
    },
    {
        id: 'aws_access_key',
        name: 'AWS Access Key',
        regex: /\bAKIA[0-9A-Z]{16}\b/g,
        severity: 'CRITICAL',
        category: 'credential',
    },
    {
        id: 'aws_secret_key',
        name: 'AWS Secret Key',
        regex: /(?:aws_secret_access_key|secret_key)\s*[:=]\s*['"]?[A-Za-z0-9/+=]{40}['"]?/gi,
        severity: 'CRITICAL',
        category: 'credential',
    },
    {
        id: 'pem_private_key',
        name: 'PEM Private Key',
        regex: /-----BEGIN\s(?:RSA\s)?PRIVATE\sKEY-----/g,
        severity: 'CRITICAL',
        category: 'credential',
    },
    {
        id: 'bearer_token',
        name: 'Bearer Token',
        regex: /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/g,
        severity: 'CRITICAL',
        category: 'credential',
    },
    {
        id: 'github_token',
        name: 'GitHub Token',
        regex: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g,
        severity: 'CRITICAL',
        category: 'credential',
    },
    {
        id: 'jwt_token',
        name: 'JWT Token',
        regex: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
        severity: 'CRITICAL',
        category: 'credential',
    },
];

/**
 * Layer 1: Synchronous scan for critical patterns.
 *
 * Designed to run on every keystroke without noticeable latency.
 * Only checks a small set of high-signal credential patterns.
 */
export function scanLayer1(text: string): PiiMatch[] {
    const matches: PiiMatch[] = [];

    for (const pattern of CRITICAL_PATTERNS) {
        // Reset lastIndex for global regexes
        pattern.regex.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = pattern.regex.exec(text)) !== null) {
            matches.push({
                patternId: pattern.id,
                patternName: pattern.name,
                category: pattern.category,
                matchedText: match[0],
                start: match.index,
                end: match.index + match[0].length,
                severity: pattern.severity,
                countryCode: null,
                layer: 1,
            });
        }
    }

    return matches;
}

// ── Layer 2: Native Module Full Pattern Scan ─────────────────────────────────

/** Shape of the native PII scan result from the Rust/JSI bridge. */
interface NativePiiMatch {
    pattern_id: string;
    pattern_name: string;
    category: string;
    matched_text: string;
    start: number;
    end: number;
    sensitivity: number;
    country_code: string;
}

/** Map sensitivity (1-5) to PiiSeverity. */
function sensitivityToSeverity(sensitivity: number): PiiSeverity {
    if (sensitivity >= 5) return 'CRITICAL';
    if (sensitivity >= 4) return 'HIGH';
    if (sensitivity >= 3) return 'MEDIUM';
    return 'LOW';
}

/**
 * Layer 2: Full pattern scan via the native Zipminator crypto module.
 *
 * Calls the Rust PII scanner through the JSI bridge. Falls back gracefully
 * if the native module is unavailable (returns empty array).
 */
export async function scanLayer2(
    text: string,
    countries: string[] = ['us', 'uk', 'ae'],
): Promise<PiiMatch[]> {
    try {
        // Dynamic import to avoid hard crash if the native module is missing
        const ZipminatorCrypto = (await import('../../modules/zipminator-crypto')).default;

        if (typeof ZipminatorCrypto.piiScan !== 'function') {
            // Native module does not yet expose piiScan -- return empty
            return [];
        }

        const jsonResult: string = await ZipminatorCrypto.piiScan(text, countries);
        const nativeMatches: NativePiiMatch[] = JSON.parse(jsonResult);

        return nativeMatches.map((nm) => ({
            patternId: nm.pattern_id,
            patternName: nm.pattern_name,
            category: nm.category,
            matchedText: nm.matched_text,
            start: nm.start,
            end: nm.end,
            severity: sensitivityToSeverity(nm.sensitivity),
            countryCode: nm.country_code,
            layer: 2 as const,
        }));
    } catch {
        // Native module unavailable or errored -- degrade gracefully
        return [];
    }
}

// ── Layer 3: Deep NER Scan (Placeholder) ─────────────────────────────────────

/**
 * Interface for future NER-based PII detection.
 *
 * TODO: Integrate with an on-device NER model (e.g. TFLite BERT-NER)
 * to detect PII that regex alone cannot catch -- names, addresses,
 * medical conditions, etc.
 */
export interface NerScanProvider {
    /** Run NER-based entity recognition on text. */
    scan(text: string): Promise<PiiMatch[]>;
    /** Whether the NER model is loaded and ready. */
    isReady(): boolean;
}

/**
 * Layer 3: Deep NER scan (placeholder implementation).
 *
 * Returns empty results until a NER provider is registered.
 */
export async function scanLayer3(
    _text: string,
    _provider?: NerScanProvider,
): Promise<PiiMatch[]> {
    if (_provider && _provider.isReady()) {
        return _provider.scan(_text);
    }
    // TODO: Integrate NER model
    return [];
}

// ── Debounce Utility ─────────────────────────────────────────────────────────

/**
 * Creates a debounced version of an async function.
 *
 * The returned function delays invocation until `delayMs` milliseconds have
 * elapsed since the last call. If called again before the delay, the previous
 * pending invocation is cancelled.
 */
export function debounce<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    delayMs: number,
): (...args: Parameters<T>) => Promise<ReturnType<T> | undefined> {
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let activeResolve: ((value: any) => void) | null = null;

    return (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
        // Cancel previous timer
        if (timerId !== null) {
            clearTimeout(timerId);
            // Resolve previous promise with undefined (cancelled)
            if (activeResolve) {
                activeResolve(undefined);
                activeResolve = null;
            }
        }

        return new Promise((resolve) => {
            activeResolve = resolve;
            timerId = setTimeout(async () => {
                timerId = null;
                activeResolve = null;
                const result = await fn(...args);
                resolve(result);
            }, delayMs);
        });
    };
}

// ── PII Scanner Service ──────────────────────────────────────────────────────

/** Configuration for the PII scanner pipeline. */
export interface PiiScannerConfig {
    /** Debounce delay for Layer 2 in ms (default: 200) */
    debounceMs?: number;
    /** Country codes to scan (default: ['us', 'uk', 'ae']) */
    countries?: string[];
    /** Optional NER provider for Layer 3 */
    nerProvider?: NerScanProvider;
    /** Whether to enable Layer 2 native scan (default: true) */
    enableNativeScan?: boolean;
    /** Whether to enable Layer 3 NER scan (default: false) */
    enableNerScan?: boolean;
}

type PiiScanCallback = (result: PiiScanResult) => void;

/**
 * PII scanning pipeline for email compose flow.
 *
 * Provides a three-layer scanning architecture:
 * - Layer 1 runs instantly on every call to `scan()` and fires the callback
 *   immediately if critical patterns are found.
 * - Layer 2 is debounced and calls the native Rust scanner for full coverage.
 * - Layer 3 is a placeholder for future NER integration.
 *
 * Usage:
 * ```ts
 * const scanner = new PiiScannerService({ debounceMs: 200 });
 * scanner.onResult((result) => {
 *     if (result.maxSeverity === 'CRITICAL') showWarning(result);
 * });
 * // Call on every keystroke:
 * scanner.scan(emailBodyText);
 * ```
 */
export class PiiScannerService {
    private config: Required<PiiScannerConfig>;
    private callbacks: PiiScanCallback[] = [];
    private debouncedLayer2: (...args: [string, string[]]) => Promise<PiiMatch[] | undefined>;
    private lastLayer1: PiiMatch[] = [];

    constructor(config: PiiScannerConfig = {}) {
        this.config = {
            debounceMs: config.debounceMs ?? 200,
            countries: config.countries ?? ['us', 'uk', 'ae'],
            nerProvider: config.nerProvider as NerScanProvider,
            enableNativeScan: config.enableNativeScan ?? true,
            enableNerScan: config.enableNerScan ?? false,
        };

        this.debouncedLayer2 = debounce(scanLayer2, this.config.debounceMs);
    }

    /** Register a callback for scan results. */
    onResult(callback: PiiScanCallback): void {
        this.callbacks.push(callback);
    }

    /** Remove a previously registered callback. */
    offResult(callback: PiiScanCallback): void {
        this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    }

    /**
     * Scan text for PII using the three-layer pipeline.
     *
     * Layer 1 results are delivered immediately. Layer 2 results arrive after
     * the debounce period. Layer 3 results (when enabled) arrive after NER
     * processing completes.
     */
    scan(text: string): void {
        // ── Layer 1: Instant critical scan ───────────────────────────────────
        const layer1Matches = scanLayer1(text);
        this.lastLayer1 = layer1Matches;

        if (layer1Matches.length > 0) {
            this.emit({
                matches: layer1Matches,
                maxSeverity: maxSeverityOf(layer1Matches),
                pending: this.config.enableNativeScan || this.config.enableNerScan,
                timestamp: Date.now(),
            });
        }

        // ── Layer 2: Debounced native scan ───────────────────────────────────
        if (this.config.enableNativeScan) {
            this.debouncedLayer2(text, this.config.countries).then((layer2Matches) => {
                if (!layer2Matches) return; // debounce cancelled

                const combined = deduplicateMatches([...this.lastLayer1, ...layer2Matches]);
                this.emit({
                    matches: combined,
                    maxSeverity: maxSeverityOf(combined),
                    pending: this.config.enableNerScan,
                    timestamp: Date.now(),
                });

                // ── Layer 3: Deep NER scan ───────────────────────────────────
                if (this.config.enableNerScan) {
                    scanLayer3(text, this.config.nerProvider).then((layer3Matches) => {
                        const all = deduplicateMatches([...combined, ...layer3Matches]);
                        this.emit({
                            matches: all,
                            maxSeverity: maxSeverityOf(all),
                            pending: false,
                            timestamp: Date.now(),
                        });
                    });
                }
            });
        }
    }

    /** Remove all callbacks and cancel pending scans. */
    destroy(): void {
        this.callbacks = [];
        this.lastLayer1 = [];
    }

    private emit(result: PiiScanResult): void {
        for (const cb of this.callbacks) {
            cb(result);
        }
    }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const SEVERITY_ORDER: Record<PiiSeverity, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
};

/** Determine the highest severity among a set of matches. */
function maxSeverityOf(matches: PiiMatch[]): PiiSeverity | null {
    if (matches.length === 0) return null;
    let max: PiiSeverity = 'LOW';
    for (const m of matches) {
        if (SEVERITY_ORDER[m.severity] > SEVERITY_ORDER[max]) {
            max = m.severity;
        }
    }
    return max;
}

/**
 * Remove duplicate matches that overlap the same text region.
 *
 * When Layer 1 and Layer 2 both detect the same text, the higher-layer
 * (more specific) match wins.
 */
function deduplicateMatches(matches: PiiMatch[]): PiiMatch[] {
    const seen = new Map<string, PiiMatch>();
    for (const m of matches) {
        const key = `${m.start}:${m.end}:${m.matchedText}`;
        const existing = seen.get(key);
        if (!existing || m.layer > existing.layer) {
            seen.set(key, m);
        }
    }
    return Array.from(seen.values());
}
