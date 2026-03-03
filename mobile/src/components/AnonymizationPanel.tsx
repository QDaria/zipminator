import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useExpertise } from '../context/ExpertiseContext';

export default function AnonymizationPanel() {
    const { mode } = useExpertise();
    const [level, setLevel] = useState(1);

    const getLevelDescription = (l: number) => {
        if (l <= 3) return "Basic Masking (Names & IDs hidden)";
        if (l <= 7) return "Advanced Encryption (K-Anonymity & T-Closeness)";
        return "Quantum Pseudoanonymization (True IBM Harvester Noise)";
    };

    if (mode === 'novice') {
        return (
            <View className="w-full bg-white/5 rounded-2xl p-6 mb-8 border border-white/10">
                <View className="items-center mb-6">
                    <Text className="text-white text-xl font-bold mb-2">Data Privacy Engine</Text>
                    <Text className="text-gray-400 text-center text-sm mb-6">
                        Protect sensitive files before sending them. Drag the slider to increase the security level.
                    </Text>

                    <View className="w-full items-center mb-6">
                        <Text className="text-quantum-400 font-bold text-3xl mb-2">Level {Math.floor(level)}</Text>
                        <Text className="text-white font-medium text-center">{getLevelDescription(Math.floor(level))}</Text>
                    </View>

                    {/* Note: In a real app, use @react-native-community/slider or similar */}
                    <View className="flex-row items-center w-full justify-between mb-8">
                        <TouchableOpacity onPress={() => setLevel(Math.max(1, level - 1))} className="bg-white/10 w-10 h-10 rounded-full items-center justify-center">
                            <Text className="text-white text-xl">-</Text>
                        </TouchableOpacity>
                        <View className="flex-1 h-2 bg-gray-800 rounded-full mx-4 flex-row">
                            <View className="h-full bg-quantum-500 rounded-full" style={{ width: `${(level / 10) * 100}%` }} />
                        </View>
                        <TouchableOpacity onPress={() => setLevel(Math.min(10, level + 1))} className="bg-white/10 w-10 h-10 rounded-full items-center justify-center">
                            <Text className="text-white text-xl">+</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity className="w-full bg-quantum-600 rounded-full py-4 items-center">
                        <Text className="text-white font-bold text-lg">Anonymize File</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // EXPERT MODE
    return (
        <View className="w-full bg-black/60 rounded-2xl p-6 mb-8 border border-quantum-500/30">

            <View className="flex-row justify-between items-center mb-4 border-b border-white/10 pb-4">
                <View>
                    <Text className="text-quantum-400 font-mono text-sm font-bold">10-LEVEL DATA ANONYMIZATION</Text>
                    <Text className="text-gray-500 font-mono text-[10px]">INJECTOR: IBM MARRAKESH 156Q QRNG</Text>
                </View>
                <Text className="text-white font-mono text-xl font-bold">LVL_{Math.floor(level)}</Text>
            </View>

            <View className="bg-black border border-white/20 p-4 rounded-lg mb-6">
                <Text className="text-gray-400 font-mono text-xs mb-2">CURRENT PIPELINE GRAPH:</Text>
                {level >= 1 && <Text className="text-green-500 font-mono text-[10px]">1. STATIC_MASKING(regex_pii)</Text>}
                {level >= 4 && <Text className="text-green-500 font-mono text-[10px]">2. K_ANONYMITY(k=5)</Text>}
                {level >= 6 && <Text className="text-green-500 font-mono text-[10px]">3. DIFFERENTIAL_PRIVACY(epsilon=0.1)</Text>}
                {level >= 8 && <Text className="text-quantum-400 font-mono text-[10px]">4. QRNG_NOISE_INJECTION(source=qbraid)</Text>}
                {level >= 10 && <Text className="text-quantum-400 font-mono text-[10px]">5. QUANTUM_PSEUDOANONYMIZATION(active)</Text>}
            </View>

            <View className="flex-row items-center w-full justify-between mb-6">
                <TouchableOpacity onPress={() => setLevel(Math.max(1, level - 1))} className="bg-white/10 w-8 h-8 rounded-full items-center justify-center px-0">
                    <Text className="text-white font-mono">-</Text>
                </TouchableOpacity>
                <View className="flex-1 h-1 bg-gray-800 mx-4 flex-row">
                    <View className="h-full bg-quantum-500" style={{ width: `${(level / 10) * 100}%` }} />
                </View>
                <TouchableOpacity onPress={() => setLevel(Math.min(10, level + 1))} className="bg-white/10 w-8 h-8 rounded-full items-center justify-center px-0">
                    <Text className="text-white font-mono">+</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity className="w-full bg-quantum-900/40 border border-quantum-500 rounded-lg py-3 items-center">
                <Text className="text-quantum-400 font-mono font-bold">EXEC PIPELINE(input_df)</Text>
            </TouchableOpacity>

        </View>
    );
}
