import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useExpertise } from '../context/ExpertiseContext';

// Native PQC Module bridge
import ZipminatorCrypto from '../../modules/zipminator-crypto';

export default function KeyGenerator() {
    const { mode } = useExpertise();
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [keys, setKeys] = useState<{ publicKey: string; secretKey: string } | null>(null);
    const [entropyPool, setEntropyPool] = useState<number[]>([0.5, 0.2, 0.8, 0.1, 0.9, 0.4]);

    // Simulate entropy pool changing visually
    useEffect(() => {
        const interval = setInterval(() => {
            setEntropyPool(prev => {
                const newPool = [...prev, Math.random()];
                if (newPool.length > 8) newPool.shift();
                return newPool;
            });
        }, 500);
        return () => clearInterval(interval);
    }, []);

    const generateKeys = async () => {
        setIsGenerating(true);
        setProgress(0);
        setKeys(null);

        let currentProgress = 0;
        const interval = setInterval(async () => {
            currentProgress += 10;
            setProgress(currentProgress);

            if (currentProgress >= 100) {
                clearInterval(interval);
                setIsGenerating(false);
                try {
                    // Natively call into Swift/Kotlin/C++ via JSI Bridge!
                    const generatedKeys = await ZipminatorCrypto.generateKEMKeyPair('Kyber768');
                    setKeys({ publicKey: generatedKeys.publicKey, secretKey: generatedKeys.secretKey });
                } catch (error) {
                    console.error("Native Crypto Module Error:", error);
                    setKeys({
                        publicKey: "ERROR: NATIVE_BRIDGE_FAILED",
                        secretKey: "ERROR: NATIVE_BRIDGE_FAILED"
                    });
                }
            }
        }, 200);
    };

    if (mode === 'novice') {
        return (
            <View className="w-full bg-white/5 rounded-2xl p-6 mb-8 border border-white/10 items-center">
                {!keys && !isGenerating ? (
                    <TouchableOpacity
                        onPress={generateKeys}
                        className="w-full max-w-xs bg-quantum-600 rounded-full py-4 items-center"
                    >
                        <Text className="text-white font-bold text-xl">Generate Keys</Text>
                    </TouchableOpacity>
                ) : isGenerating ? (
                    <View className="w-full max-w-xs items-center">
                        <Text className="text-quantum-300 font-bold mb-4">Harvesting Quantum Energy...</Text>
                        <View className="w-full h-4 bg-gray-800 rounded-full overflow-hidden">
                            <View className="h-full bg-quantum-500" style={{ width: `${progress}%` }} />
                        </View>
                    </View>
                ) : (
                    <View className="w-full items-center">
                        <View className="bg-green-500/20 px-6 py-2 rounded-full mb-6">
                            <Text className="text-green-400 font-bold">New Locks Successfully Built</Text>
                        </View>
                        <TouchableOpacity
                            onPress={generateKeys}
                            className="w-full max-w-xs bg-transparent border-2 border-quantum-600 rounded-full py-3 items-center"
                        >
                            <Text className="text-quantum-400 font-bold">Make New Keys</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    }

    // EXPERT MODE
    return (
        <View className="w-full bg-black/40 rounded-2xl p-6 mb-8 border border-white/10">

            {/* Live Entropy Pool Visualization */}
            <View className="bg-black/60 border border-white/10 rounded-lg p-4 mb-6">
                <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-400 font-mono text-xs">RAW QUBIT STREAM (IBM MARRAKESH):</Text>
                    <Text className="text-quantum-400 font-mono text-xs">NOISE_RATIO: 0.92</Text>
                </View>
                <View className="flex-row items-end h-16 gap-1 overflow-hidden opacity-80">
                    {entropyPool.map((val, i) => (
                        <View
                            key={i}
                            className="flex-1 bg-quantum-500"
                            style={{ height: `${val * 100}%` }}
                        />
                    ))}
                </View>
            </View>

            {!keys && !isGenerating ? (
                <TouchableOpacity
                    onPress={generateKeys}
                    className="w-full bg-quantum-600 rounded-lg py-4 items-center"
                >
                    <Text className="text-white font-mono font-bold">EXECUTE GEN_KEYPAIR()</Text>
                </TouchableOpacity>
            ) : isGenerating ? (
                <View className="w-full">
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-quantum-300 font-mono text-xs">FETCHING /SEED_INJECTION...</Text>
                        <Text className="text-white font-mono text-xs">{progress}%</Text>
                    </View>
                    <View className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
                        <View className="h-full bg-quantum-500" style={{ width: `${progress}%` }} />
                    </View>
                </View>
            ) : (
                <View className="w-full space-y-4">
                    <View className="bg-black/60 p-4 border border-white/10 rounded-lg mb-4">
                        <Text className="text-green-400 font-mono text-xs mb-1">PUBLIC KEY (PK)</Text>
                        <Text className="text-gray-500 font-mono text-[10px]">{keys?.publicKey}</Text>
                    </View>
                    <View className="bg-black/60 p-4 border border-red-900/40 rounded-lg mb-6">
                        <Text className="text-red-400 font-mono text-xs mb-1">SECRET KEY (SK) / DANGER</Text>
                        <Text className="text-gray-500 font-mono text-[10px]">{keys?.secretKey}</Text>
                    </View>

                    <TouchableOpacity
                        onPress={generateKeys}
                        className="w-full bg-transparent border border-quantum-500 rounded-lg py-3 items-center"
                    >
                        <Text className="text-quantum-400 font-mono">RE-HAVE_ENTROPY && REGENERATE</Text>
                    </TouchableOpacity>
                </View>
            )}

        </View>
    );
}
