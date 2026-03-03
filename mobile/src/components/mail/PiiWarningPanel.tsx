import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useExpertise } from '../../context/ExpertiseContext';
import type { PiiWarning, PiiSeverity } from '../../types/email';

// ── Props ───────────────────────────────────────────────────────────────────

interface PiiWarningPanelProps {
    warnings: PiiWarning[];
    /** Called when the user taps "Redact" on a specific match. */
    onRedact: (warning: PiiWarning) => void;
    /** Called when the user taps "Redact All". */
    onRedactAll: () => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const SEVERITY_ORDER: Record<PiiSeverity, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
};

function severityColor(severity: PiiSeverity): string {
    switch (severity) {
        case 'CRITICAL':
            return 'text-red-400';
        case 'HIGH':
            return 'text-orange-400';
        case 'MEDIUM':
            return 'text-yellow-400';
        case 'LOW':
            return 'text-blue-400';
    }
}

function severityBg(severity: PiiSeverity): string {
    switch (severity) {
        case 'CRITICAL':
            return 'bg-red-500/20';
        case 'HIGH':
            return 'bg-orange-500/15';
        case 'MEDIUM':
            return 'bg-yellow-500/10';
        case 'LOW':
            return 'bg-blue-500/10';
    }
}

function severityIcon(severity: PiiSeverity): string {
    switch (severity) {
        case 'CRITICAL':
            return '\u{26A0}'; // warning
        case 'HIGH':
            return '\u{1F6A8}'; // rotating light
        case 'MEDIUM':
            return '\u{1F50D}'; // magnifying glass
        case 'LOW':
            return '\u{2139}'; // info
    }
}

/** Partially mask matched text: show first 2 and last 2 characters. */
function maskText(text: string): string {
    if (text.length <= 6) return '*'.repeat(text.length);
    return text.slice(0, 2) + '*'.repeat(Math.min(text.length - 4, 12)) + text.slice(-2);
}

function groupBySeverity(warnings: PiiWarning[]): Map<PiiSeverity, PiiWarning[]> {
    const groups = new Map<PiiSeverity, PiiWarning[]>();
    for (const w of warnings) {
        const arr = groups.get(w.severity) ?? [];
        arr.push(w);
        groups.set(w.severity, arr);
    }
    return groups;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function PiiWarningPanel({ warnings, onRedact, onRedactAll }: PiiWarningPanelProps) {
    const { mode } = useExpertise();
    const [collapsed, setCollapsed] = useState(false);

    if (warnings.length === 0) return null;

    const hasCritical = warnings.some((w) => w.severity === 'CRITICAL');

    // ── Collapsed badge ─────────────────────────────────────────────────────

    if (collapsed) {
        return (
            <TouchableOpacity
                onPress={() => setCollapsed(false)}
                className={`flex-row items-center justify-between px-3 py-2 mt-2 rounded-lg border ${
                    hasCritical
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-yellow-500/10 border-yellow-500/30'
                }`}
            >
                <Text className={hasCritical ? 'text-red-400 text-xs' : 'text-yellow-400 text-xs'}>
                    {warnings.length} PII warning{warnings.length !== 1 ? 's' : ''} found
                </Text>
                <Text className="text-gray-500 text-[10px]">Tap to expand</Text>
            </TouchableOpacity>
        );
    }

    // ── Novice mode ─────────────────────────────────────────────────────────

    if (mode === 'novice') {
        return (
            <View className="mt-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-yellow-400 text-xs font-semibold">
                        We found sensitive information in your email
                    </Text>
                    <TouchableOpacity onPress={() => setCollapsed(true)}>
                        <Text className="text-gray-500 text-[10px]">Hide</Text>
                    </TouchableOpacity>
                </View>

                {/* Warning list */}
                {warnings.map((w, idx) => (
                    <NoviceWarningRow key={`${w.patternId}-${idx}`} warning={w} onRedact={onRedact} />
                ))}

                {/* Redact All button */}
                {warnings.length > 1 && (
                    <TouchableOpacity
                        onPress={onRedactAll}
                        className="mt-2 bg-yellow-500/20 rounded-lg py-2 items-center"
                    >
                        <Text className="text-yellow-400 text-xs font-bold">
                            Redact All ({warnings.length})
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    // ── Expert mode ─────────────────────────────────────────────────────────

    const grouped = groupBySeverity(warnings);
    const sortedGroups = [...grouped.entries()].sort(
        (a, b) => SEVERITY_ORDER[b[0]] - SEVERITY_ORDER[a[0]],
    );

    return (
        <View className="mt-2 border border-quantum-500/20 bg-black/40 p-2">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-2">
                <Text className="text-quantum-400 font-mono text-[10px] font-bold">
                    PII SCAN RESULTS ({warnings.length})
                </Text>
                <TouchableOpacity onPress={() => setCollapsed(true)}>
                    <Text className="text-gray-600 font-mono text-[9px]">[COLLAPSE]</Text>
                </TouchableOpacity>
            </View>

            {/* Grouped table */}
            {sortedGroups.map(([severity, items]) => (
                <View key={severity} className="mb-2">
                    <Text className={`${severityColor(severity)} font-mono text-[9px] font-bold mb-1`}>
                        -- {severity} ({items.length}) --
                    </Text>

                    {/* Table header */}
                    <View className="flex-row mb-0.5">
                        <Text className="text-gray-600 font-mono text-[8px] w-24">PATTERN_ID</Text>
                        <Text className="text-gray-600 font-mono text-[8px] w-16">OFFSET</Text>
                        <Text className="text-gray-600 font-mono text-[8px] flex-1">MATCH</Text>
                        <Text className="text-gray-600 font-mono text-[8px] w-12">ACT</Text>
                    </View>

                    {items.map((w, idx) => (
                        <ExpertWarningRow key={`${w.patternId}-${idx}`} warning={w} onRedact={onRedact} />
                    ))}
                </View>
            ))}

            {/* Redact All */}
            {warnings.length > 1 && (
                <TouchableOpacity
                    onPress={onRedactAll}
                    className="mt-1 border border-red-500/40 bg-red-900/20 py-1 items-center"
                >
                    <Text className="text-red-400 font-mono text-[9px] font-bold">
                        REDACT_ALL ({warnings.length})
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

// ── Novice warning row ──────────────────────────────────────────────────────

function NoviceWarningRow({
    warning,
    onRedact,
}: {
    warning: PiiWarning;
    onRedact: (w: PiiWarning) => void;
}) {
    return (
        <View className={`flex-row items-center ${severityBg(warning.severity)} rounded-lg px-2 py-1.5 mb-1`}>
            <Text className="mr-2">{severityIcon(warning.severity)}</Text>
            <View className="flex-1">
                <Text className={`${severityColor(warning.severity)} text-xs font-semibold`}>
                    {warning.patternName}
                </Text>
                <Text className="text-gray-400 font-mono text-[10px]">
                    {maskText(warning.matchedText)}
                </Text>
            </View>
            <TouchableOpacity
                onPress={() => onRedact(warning)}
                className="bg-red-500/20 px-2 py-1 rounded"
            >
                <Text className="text-red-400 text-[10px] font-bold">Redact</Text>
            </TouchableOpacity>
        </View>
    );
}

// ── Expert warning row ──────────────────────────────────────────────────────

function ExpertWarningRow({
    warning,
    onRedact,
}: {
    warning: PiiWarning;
    onRedact: (w: PiiWarning) => void;
}) {
    const isCritical = warning.severity === 'CRITICAL';

    return (
        <CriticalPulseWrapper enabled={isCritical}>
            <View className="flex-row items-center py-0.5">
                <Text className={`${severityColor(warning.severity)} font-mono text-[8px] w-24`}>
                    {warning.patternId}
                </Text>
                <Text className="text-gray-500 font-mono text-[8px] w-16">
                    {warning.startOffset}:{warning.endOffset}
                </Text>
                <Text className="text-gray-400 font-mono text-[8px] flex-1" numberOfLines={1}>
                    {maskText(warning.matchedText)}
                </Text>
                <TouchableOpacity onPress={() => onRedact(warning)}>
                    <Text className="text-red-400 font-mono text-[8px] w-12 text-center">
                        [DEL]
                    </Text>
                </TouchableOpacity>
            </View>
        </CriticalPulseWrapper>
    );
}

// ── Critical pulse wrapper ──────────────────────────────────────────────────

function CriticalPulseWrapper({
    enabled,
    children,
}: {
    enabled: boolean;
    children: React.ReactNode;
}) {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!enabled) return;

        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!enabled) return <>{children}</>;

    return (
        <Animated.View style={{ opacity: pulseAnim }} className="bg-red-900/20">
            {children}
        </Animated.View>
    );
}
