import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

// ── Level metadata ────────────────────────────────────────────────────────────

interface LevelMeta {
    name: string;
    description: string;
    color: string;
    bg: string;
    requiresQuantum: boolean;
}

const LEVELS: Record<number, LevelMeta> = {
    1:  { name: 'Minimal Masking',                   description: 'Regex redaction (SSN, email)',               color: 'text-emerald-400',  bg: 'bg-emerald-500/10',  requiresQuantum: false },
    2:  { name: 'Partial Redaction',                 description: 'First/last char, middle masked',             color: 'text-green-400',    bg: 'bg-green-500/10',    requiresQuantum: false },
    3:  { name: 'Static Masking',                    description: 'All values → [REDACTED]',                    color: 'text-lime-400',     bg: 'bg-lime-500/10',     requiresQuantum: false },
    4:  { name: 'PQC Pseudonymization',              description: 'SHA-3 + Kyber-768 seed hashing',             color: 'text-yellow-400',   bg: 'bg-yellow-500/10',   requiresQuantum: false },
    5:  { name: 'Data Generalization',               description: 'Numbers into statistical ranges',            color: 'text-amber-400',    bg: 'bg-amber-500/10',    requiresQuantum: false },
    6:  { name: 'Data Suppression',                  description: 'Entire columns removed',                     color: 'text-orange-400',   bg: 'bg-orange-500/10',   requiresQuantum: false },
    7:  { name: 'Quantum Jitter',                    description: 'QRNG Gaussian noise (5% std-dev)',           color: 'text-violet-400',   bg: 'bg-violet-500/10',   requiresQuantum: true  },
    8:  { name: 'Quantum Diff. Privacy',             description: 'ε-DP Laplace via QRNG',                     color: 'text-purple-400',   bg: 'bg-purple-500/10',   requiresQuantum: true  },
    9:  { name: 'Enhanced K-Anonymity',              description: 'QRNG quantile clustering',                   color: 'text-fuchsia-400',  bg: 'bg-fuchsia-500/10',  requiresQuantum: true  },
    10: { name: 'Total Quantum Pseudo',              description: 'OTP mapping from live QRNG entropy',         color: 'text-purple-300',   bg: 'bg-purple-900/20',   requiresQuantum: true  },
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AnonymizationSliderProps {
    /** Current level (1-10). */
    level: number;
    /** Called when the user changes the level. */
    onLevelChange: (level: number) => void;
    /** Disable interaction while processing. */
    disabled?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Discrete 10-step track rendered as coloured segments. */
function LevelTrack({ level }: { level: number }) {
    const segments = Array.from({ length: 10 }, (_, i) => i + 1);

    function segColor(n: number): string {
        if (n > level) return 'bg-white/10';
        if (n <= 3)  return 'bg-emerald-500';
        if (n <= 6)  return 'bg-yellow-500';
        if (n <= 9)  return 'bg-violet-500';
        return 'bg-purple-400';
    }

    return (
        <View className="flex-row gap-0.5 h-1.5 rounded-full overflow-hidden">
            {segments.map((n) => (
                <View key={n} className={`flex-1 rounded-sm ${segColor(n)}`} />
            ))}
        </View>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AnonymizationSlider({
    level,
    onLevelChange,
    disabled = false,
}: AnonymizationSliderProps) {
    const meta = LEVELS[level];

    const decrement = useCallback(() => {
        if (!disabled && level > 1) onLevelChange(level - 1);
    }, [level, disabled, onLevelChange]);

    const increment = useCallback(() => {
        if (!disabled && level < 10) onLevelChange(level + 1);
    }, [level, disabled, onLevelChange]);

    return (
        <View className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 space-y-2">
            {/* Title row */}
            <View className="flex-row items-center justify-between">
                <Text className="text-gray-400 text-[10px] font-mono uppercase tracking-wider">
                    Anonymization Level
                </Text>
                {meta.requiresQuantum && (
                    <View className="flex-row items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/30">
                        <Text className="text-purple-400 text-[8px] font-mono">Robindra tier</Text>
                    </View>
                )}
            </View>

            {/* Level display */}
            <View className={`flex-row items-center gap-2 px-2 py-1.5 rounded-lg ${meta.bg}`}>
                <Text className={`${meta.color} font-mono text-sm font-bold`}>L{level}</Text>
                <View className="flex-1">
                    <Text className={`${meta.color} text-xs font-semibold`}>{meta.name}</Text>
                    <Text className="text-gray-500 text-[10px] mt-0.5 leading-tight">
                        {meta.description}
                    </Text>
                </View>
            </View>

            {/* Track */}
            <LevelTrack level={level} />

            {/* Stepper buttons */}
            <View className="flex-row items-center gap-2">
                <TouchableOpacity
                    onPress={decrement}
                    disabled={disabled || level <= 1}
                    className={`flex-1 py-2 rounded-lg items-center border
                        ${disabled || level <= 1
                            ? 'border-white/5 bg-white/[0.02]'
                            : 'border-white/[0.08] bg-white/[0.04] active:bg-white/[0.08]'
                        }`}
                >
                    <Text className={`text-sm font-bold ${disabled || level <= 1 ? 'text-gray-700' : 'text-gray-300'}`}>
                        −
                    </Text>
                </TouchableOpacity>

                {/* Quick-select chips for key levels */}
                {[1, 5, 10].map((n) => (
                    <TouchableOpacity
                        key={n}
                        onPress={() => !disabled && onLevelChange(n)}
                        disabled={disabled}
                        className={`px-3 py-2 rounded-lg border items-center
                            ${level === n
                                ? `${LEVELS[n].bg} border-transparent`
                                : 'border-white/[0.06] bg-white/[0.02]'
                            }`}
                    >
                        <Text className={`text-[10px] font-mono font-bold ${level === n ? LEVELS[n].color : 'text-gray-600'}`}>
                            L{n}
                        </Text>
                    </TouchableOpacity>
                ))}

                <TouchableOpacity
                    onPress={increment}
                    disabled={disabled || level >= 10}
                    className={`flex-1 py-2 rounded-lg items-center border
                        ${disabled || level >= 10
                            ? 'border-white/5 bg-white/[0.02]'
                            : 'border-white/[0.08] bg-white/[0.04] active:bg-white/[0.08]'
                        }`}
                >
                    <Text className={`text-sm font-bold ${disabled || level >= 10 ? 'text-gray-700' : 'text-gray-300'}`}>
                        +
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Legend */}
            <View className="flex-row gap-3 pt-0.5">
                {[
                    { label: 'L1-L3 Masking', color: 'text-emerald-600' },
                    { label: 'L4-L6 Hash', color: 'text-yellow-600' },
                    { label: 'L7-L10 Quantum', color: 'text-violet-500' },
                ].map(({ label, color }) => (
                    <Text key={label} className={`${color} text-[8px] font-mono`}>{label}</Text>
                ))}
            </View>
        </View>
    );
}
