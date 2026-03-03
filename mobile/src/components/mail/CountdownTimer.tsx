import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';

// ── Props ───────────────────────────────────────────────────────────────────

interface CountdownTimerProps {
    /** Absolute Unix-ms timestamp when the message expires. */
    expiresAt: number;
    /** Fired once the countdown reaches zero. */
    onExpired: () => void;
    /** If true, render compact inline format (HH:MM:SS). */
    compact?: boolean;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pad(n: number): string {
    return n.toString().padStart(2, '0');
}

function formatRemaining(ms: number): { dd: string; hh: string; mm: string; ss: string } {
    if (ms <= 0) return { dd: '00', hh: '00', mm: '00', ss: '00' };

    const totalSec = Math.floor(ms / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    return { dd: pad(days), hh: pad(hours), mm: pad(minutes), ss: pad(seconds) };
}

/** Map remaining-ms to a Tailwind-compatible color token. */
function timerColor(ms: number): string {
    if (ms <= 0) return 'text-red-500';
    if (ms < 3600_000) return 'text-red-400';          // < 1 hour
    if (ms < 21600_000) return 'text-orange-400';       // < 6 hours
    if (ms < 86400_000) return 'text-yellow-400';       // < 1 day
    return 'text-green-400';
}

// ── Component ───────────────────────────────────────────────────────────────

export default function CountdownTimer({ expiresAt, onExpired, compact = false }: CountdownTimerProps) {
    const [remaining, setRemaining] = useState(expiresAt - Date.now());
    const [destroyed, setDestroyed] = useState(false);

    // Pulsing animation when under 1 hour
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const hasFired = useRef(false);

    // Tick every second
    useEffect(() => {
        const interval = setInterval(() => {
            const diff = expiresAt - Date.now();
            setRemaining(diff);

            if (diff <= 0 && !hasFired.current) {
                hasFired.current = true;
                setDestroyed(true);
                onExpired();
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [expiresAt, onExpired]);

    // Pulse animation when under 1 hour
    useEffect(() => {
        if (remaining > 0 && remaining < 3600_000) {
            const loop = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 0.4,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                ]),
            );
            loop.start();
            return () => loop.stop();
        }
        pulseAnim.setValue(1);
    }, [remaining < 3600_000]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Destroyed state ─────────────────────────────────────────────────────

    if (destroyed) {
        return (
            <View className="items-center justify-center py-2">
                <Text className="text-red-500 font-mono font-bold text-xs tracking-widest">
                    DESTROYED
                </Text>
            </View>
        );
    }

    // ── Active countdown ────────────────────────────────────────────────────

    const { dd, hh, mm, ss } = formatRemaining(remaining);
    const color = timerColor(remaining);
    const shouldPulse = remaining > 0 && remaining < 3600_000;

    if (compact) {
        return (
            <Animated.View style={shouldPulse ? { opacity: pulseAnim } : undefined}>
                <Text className={`${color} font-mono text-xs`}>
                    {dd !== '00' ? `${dd}:` : ''}{hh}:{mm}:{ss}
                </Text>
            </Animated.View>
        );
    }

    return (
        <Animated.View
            className="flex-row items-center justify-center py-1"
            style={shouldPulse ? { opacity: pulseAnim } : undefined}
        >
            <Segment value={dd} label="DAYS" color={color} />
            <Text className={`${color} font-mono text-lg mx-1`}>:</Text>
            <Segment value={hh} label="HRS" color={color} />
            <Text className={`${color} font-mono text-lg mx-1`}>:</Text>
            <Segment value={mm} label="MIN" color={color} />
            <Text className={`${color} font-mono text-lg mx-1`}>:</Text>
            <Segment value={ss} label="SEC" color={color} />
        </Animated.View>
    );
}

// ── Segment sub-component ───────────────────────────────────────────────────

function Segment({ value, label, color }: { value: string; label: string; color: string }) {
    return (
        <View className="items-center mx-1">
            <Text className={`${color} font-mono font-bold text-lg`}>{value}</Text>
            <Text className="text-gray-500 font-mono text-[8px]">{label}</Text>
        </View>
    );
}
