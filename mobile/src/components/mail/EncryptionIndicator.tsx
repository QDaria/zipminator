import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useExpertise } from '../../context/ExpertiseContext';
import type { EncryptionLevel } from '../../types/email';

// ── Props ───────────────────────────────────────────────────────────────────

interface EncryptionIndicatorProps {
    level: EncryptionLevel;
    /** Hex-encoded composite key fingerprint (shown on tap in novice, always in expert). */
    fingerprint?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function colorForLevel(level: EncryptionLevel): string {
    switch (level) {
        case 'pqc':
            return 'text-green-400';
        case 'tls':
            return 'text-blue-400';
        case 'none':
            return 'text-gray-500';
    }
}

function bgForLevel(level: EncryptionLevel): string {
    switch (level) {
        case 'pqc':
            return 'bg-green-500/20';
        case 'tls':
            return 'bg-blue-500/20';
        case 'none':
            return 'bg-gray-500/20';
    }
}

function borderForLevel(level: EncryptionLevel): string {
    switch (level) {
        case 'pqc':
            return 'border-green-500/30';
        case 'tls':
            return 'border-blue-500/30';
        case 'none':
            return 'border-gray-500/30';
    }
}

function lockIcon(level: EncryptionLevel): string {
    switch (level) {
        case 'pqc':
            return '\u{1F512}'; // locked
        case 'tls':
            return '\u{1F510}'; // locked with key
        case 'none':
            return '\u{1F513}'; // unlocked
    }
}

function noviceLabel(level: EncryptionLevel): string {
    switch (level) {
        case 'pqc':
            return 'Quantum Secure';
        case 'tls':
            return 'Standard Encryption';
        case 'none':
            return 'Not Encrypted';
    }
}

/** Format a fingerprint for display: groups of 4 hex chars. */
function formatFingerprint(fp: string): string {
    return fp.replace(/(.{4})/g, '$1 ').trim().toUpperCase();
}

// ── Component ───────────────────────────────────────────────────────────────

export default function EncryptionIndicator({ level, fingerprint }: EncryptionIndicatorProps) {
    const { mode } = useExpertise();
    const [showFingerprint, setShowFingerprint] = useState(false);

    // ── Novice mode ─────────────────────────────────────────────────────────

    if (mode === 'novice') {
        return (
            <TouchableOpacity
                onPress={() => fingerprint && setShowFingerprint(!showFingerprint)}
                activeOpacity={fingerprint ? 0.7 : 1}
            >
                <View className={`flex-row items-center ${bgForLevel(level)} rounded-full px-3 py-1`}>
                    <Text className="mr-1 text-sm">{lockIcon(level)}</Text>
                    <Text className={`${colorForLevel(level)} text-xs font-semibold`}>
                        {noviceLabel(level)}
                    </Text>
                </View>

                {showFingerprint && fingerprint && (
                    <View className="mt-1 bg-black/60 rounded-lg px-3 py-2">
                        <Text className="text-gray-400 text-[10px] mb-1">Key Fingerprint</Text>
                        <Text className="text-quantum-400 font-mono text-[10px]">
                            {formatFingerprint(fingerprint)}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    }

    // ── Expert mode ─────────────────────────────────────────────────────────

    const algorithmChain =
        level === 'pqc'
            ? 'ML-KEM-768 | X25519 | AES-256-GCM'
            : level === 'tls'
            ? 'TLS 1.3 | AES-256-GCM'
            : 'PLAINTEXT';

    return (
        <View className={`border ${borderForLevel(level)} ${bgForLevel(level)} px-2 py-1`}>
            <View className="flex-row items-center justify-between">
                <Text className={`${colorForLevel(level)} font-mono text-[10px] font-bold`}>
                    ENC: {algorithmChain}
                </Text>
            </View>

            {fingerprint && (
                <Text className="text-gray-500 font-mono text-[10px] mt-0.5">
                    FP: {formatFingerprint(fingerprint)}
                </Text>
            )}
        </View>
    );
}
