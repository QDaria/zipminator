import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useExpertise } from '../../context/ExpertiseContext';
import type { SelfDestructMode } from '../../types/email';

// ── Props ───────────────────────────────────────────────────────────────────

interface SelfDestructSelectorProps {
    mode: SelfDestructMode;
    ttlSeconds: number;
    onModeChange: (mode: SelfDestructMode) => void;
    onTtlChange: (seconds: number) => void;
}

// ── Constants ───────────────────────────────────────────────────────────────

const MODE_OPTIONS: { value: SelfDestructMode; label: string; expertLabel: string }[] = [
    { value: 'none', label: 'None', expertLabel: 'NONE' },
    { value: 'after_send', label: 'After Send', expertLabel: 'TTL_SEND' },
    { value: 'after_read', label: 'After Read', expertLabel: 'TTL_READ' },
    { value: 'read_once', label: 'Read Once', expertLabel: 'READ_ONCE' },
];

const DURATION_OPTIONS: { label: string; seconds: number }[] = [
    { label: '1h', seconds: 3600 },
    { label: '6h', seconds: 21600 },
    { label: '24h', seconds: 86400 },
    { label: '3d', seconds: 259200 },
    { label: '7d', seconds: 604800 },
    { label: '30d', seconds: 2592000 },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function previewText(mode: SelfDestructMode, ttlSeconds: number): string {
    if (mode === 'none') return 'No self-destruct timer set';
    if (mode === 'read_once') return 'Recipient can view this message exactly once';

    const label = formatDuration(ttlSeconds);
    const trigger = mode === 'after_send' ? 'sending' : 'reading';
    return `Recipient can view for ${label} after ${trigger}`;
}

function formatDuration(seconds: number): string {
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function SelfDestructSelector({
    mode,
    ttlSeconds,
    onModeChange,
    onTtlChange,
}: SelfDestructSelectorProps) {
    const { mode: expertiseMode } = useExpertise();
    const showDuration = mode === 'after_send' || mode === 'after_read';

    // ── Novice mode ─────────────────────────────────────────────────────────

    if (expertiseMode === 'novice') {
        return (
            <View className="mt-3">
                <Text className="text-gray-400 text-xs mb-2">Self-Destruct</Text>

                {/* Mode selector */}
                <View className="flex-row bg-black/30 rounded-lg overflow-hidden border border-white/10">
                    {MODE_OPTIONS.map((opt) => (
                        <TouchableOpacity
                            key={opt.value}
                            onPress={() => onModeChange(opt.value)}
                            className={`flex-1 py-2 items-center ${
                                mode === opt.value
                                    ? 'bg-quantum-600/40'
                                    : ''
                            }`}
                        >
                            <Text
                                className={`text-xs font-semibold ${
                                    mode === opt.value
                                        ? 'text-quantum-400'
                                        : 'text-gray-500'
                                }`}
                            >
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Duration picker */}
                {showDuration && (
                    <View className="flex-row mt-2 justify-between">
                        {DURATION_OPTIONS.map((opt) => (
                            <TouchableOpacity
                                key={opt.seconds}
                                onPress={() => onTtlChange(opt.seconds)}
                                className={`px-3 py-1.5 rounded-full ${
                                    ttlSeconds === opt.seconds
                                        ? 'bg-quantum-500/30 border border-quantum-400/50'
                                        : 'bg-black/30 border border-white/10'
                                }`}
                            >
                                <Text
                                    className={`text-xs ${
                                        ttlSeconds === opt.seconds
                                            ? 'text-quantum-400 font-bold'
                                            : 'text-gray-500'
                                    }`}
                                >
                                    {opt.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Preview */}
                <Text className="text-gray-500 text-[10px] mt-2 italic">
                    {previewText(mode, ttlSeconds)}
                </Text>
            </View>
        );
    }

    // ── Expert mode ─────────────────────────────────────────────────────────

    return (
        <View className="mt-3 border border-quantum-500/20 bg-black/40 p-2">
            <Text className="text-quantum-400 font-mono text-[10px] font-bold mb-2">
                SELF-DESTRUCT CONFIG
            </Text>

            {/* Mode selector (expert) */}
            <View className="flex-row">
                {MODE_OPTIONS.map((opt) => (
                    <TouchableOpacity
                        key={opt.value}
                        onPress={() => onModeChange(opt.value)}
                        className={`flex-1 py-1 items-center border ${
                            mode === opt.value
                                ? 'border-quantum-400 bg-quantum-900/30'
                                : 'border-gray-700 bg-black/30'
                        }`}
                    >
                        <Text
                            className={`font-mono text-[9px] ${
                                mode === opt.value
                                    ? 'text-quantum-400'
                                    : 'text-gray-600'
                            }`}
                        >
                            {opt.expertLabel}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Duration picker (expert) */}
            {showDuration && (
                <View className="flex-row mt-2">
                    {DURATION_OPTIONS.map((opt) => (
                        <TouchableOpacity
                            key={opt.seconds}
                            onPress={() => onTtlChange(opt.seconds)}
                            className={`flex-1 py-1 items-center border ${
                                ttlSeconds === opt.seconds
                                    ? 'border-quantum-400 bg-quantum-900/20'
                                    : 'border-gray-800'
                            }`}
                        >
                            <Text
                                className={`font-mono text-[9px] ${
                                    ttlSeconds === opt.seconds
                                        ? 'text-quantum-400'
                                        : 'text-gray-600'
                                }`}
                            >
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Raw TTL display */}
            {showDuration && (
                <Text className="text-gray-500 font-mono text-[9px] mt-1">
                    RAW_TTL: {ttlSeconds}s | REDIS_KEY: STRING | EXPIRY: {new Date(Date.now() + ttlSeconds * 1000).toISOString()}
                </Text>
            )}

            <Text className="text-gray-600 font-mono text-[9px] mt-1">
                MODE={mode.toUpperCase()} | {previewText(mode, ttlSeconds)}
            </Text>
        </View>
    );
}
