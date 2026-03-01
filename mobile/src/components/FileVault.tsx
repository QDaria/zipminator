import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useExpertise } from '../context/ExpertiseContext';

export default function FileVault() {
    const { mode } = useExpertise();
    const [isLocked, setIsLocked] = useState(false);

    const handleLock = () => setIsLocked(true);
    const handleUnlock = () => setIsLocked(false);

    if (mode === 'novice') {
        return (
            <View className="w-full bg-white/5 rounded-2xl p-6 mb-8 border border-white/10">
                <Text className="text-white text-2xl font-bold mb-2">My Safe Box</Text>
                <Text className="text-gray-400 mb-6">
                    Drop your files here. They will be protected by quantum locks.
                </Text>

                <View className="w-full h-48 bg-black/40 rounded-xl border-2 border-dashed border-white/20 items-center justify-center mb-6">
                    <Text className="text-gray-500 text-lg">Tap to select a document</Text>
                </View>

                {!isLocked ? (
                    <TouchableOpacity
                        onPress={handleLock}
                        className="w-full bg-quantum-600 rounded-full py-4 items-center"
                    >
                        <Text className="text-white font-bold text-xl">Lock Files Now</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        onPress={handleUnlock}
                        className="w-full bg-green-600 rounded-full py-4 items-center"
                    >
                        <Text className="text-white font-bold text-xl">Files are Locked Safely</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    // EXPERT MODE
    return (
        <View className="w-full bg-black/40 rounded-2xl p-6 mb-8 border border-white/10">
            <View className="flex-row justify-between items-center mb-6">
                <View>
                    <Text className="text-quantum-400 font-mono text-lg font-bold">Q-VAULT / ENCRYPTION ENGINE</Text>
                    <Text className="text-gray-500 font-mono text-xs">ALGORITHM: FIPS-203 ML-KEM + AES-256-GCM</Text>
                </View>
                <View className="bg-black/50 border border-quantum-500/30 px-3 py-1 rounded">
                    <Text className="text-quantum-300 font-mono text-xs">V. 1.0.0</Text>
                </View>
            </View>

            <View className="w-full bg-black/60 border border-white/10 rounded-lg p-4 mb-6">
                <Text className="text-gray-400 font-mono text-xs mb-2">TARGET PAYLOAD:</Text>
                <View className="w-full h-32 border border-dashed border-quantum-500/50 rounded flex items-center justify-center bg-quantum-500/5">
                    <Text className="text-quantum-300/50 font-mono text-sm">AWAITING_INPUT_STREAM...</Text>
                </View>
            </View>

            <View className="flex-row justify-between gap-4">
                <TouchableOpacity
                    onPress={handleLock}
                    className="flex-1 bg-transparent border-2 border-quantum-600 rounded-lg py-3 items-center"
                >
                    <Text className="text-quantum-400 font-mono font-bold">ENCRYPT_BUFFER()</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleUnlock}
                    className="flex-1 bg-quantum-600 border border-quantum-400 rounded-lg py-3 items-center"
                >
                    <Text className="text-white font-mono font-bold">DECRYPT_BUFFER()</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
