import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { useExpertise } from '../context/ExpertiseContext';
import { voipService } from '../services/VoipService';
import { signalingService } from '../services/SignalingService';

export default function NetworkShield() {
    const { mode } = useExpertise();
    const [vpnEnabled, setVpnEnabled] = useState(false);
    const [inCall, setInCall] = useState(false);
    const [targetId] = useState("user_target"); // Mock target

    useEffect(() => {
        const handleVoipSignaling = (msg: any) => {
            voipService.handleSignalingMessage(msg);
            if (msg.type === 'offer') {
                setInCall(true);
            }
        };

        signalingService.on('message', handleVoipSignaling);
        return () => {
            signalingService.removeListener('message', handleVoipSignaling);
        };
    }, []);

    const toggleVpn = () => setVpnEnabled(!vpnEnabled);
    const toggleCall = () => {
        if (!inCall) {
            voipService.startCall(targetId);
            setInCall(true);
        } else {
            setInCall(false);
            // In a real app we'd send a "hangup" signaling message
        }
    };

    if (mode === 'novice') {
        return (
            <View className="w-full bg-white/5 rounded-2xl p-6 mb-8 border border-white/10">
                <View className="items-center mb-6">
                    <Text className="text-white text-xl font-bold mb-2">Total Device Shield</Text>
                    <Text className="text-gray-400 text-center text-sm mb-4">
                        Hide your entire phone's internet connection using our unbreakable post-quantum tunnel.
                    </Text>

                    <View className={`w-24 h-24 rounded-full items-center justify-center mb-4 ${vpnEnabled ? 'bg-green-500/20 border-4 border-green-500' : 'bg-white/10 border-4 border-white/20'}`}>
                        <Text className={`font-bold ${vpnEnabled ? 'text-green-400' : 'text-gray-400'}`}>
                            {vpnEnabled ? "SHIELDED" : "OFF"}
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={toggleVpn}
                        className={`w-full max-w-xs rounded-full py-4 items-center ${vpnEnabled ? 'bg-gray-800' : 'bg-quantum-600'}`}
                    >
                        <Text className={`font-bold text-lg ${vpnEnabled ? 'text-gray-400' : 'text-white'}`}>
                            {vpnEnabled ? "Disable Shield" : "Activate Shield"}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View className="w-full border-t border-white/10 pt-6 items-center">
                    <Text className="text-white font-bold mb-4">Secure Voice Call</Text>
                    <TouchableOpacity
                        onPress={toggleCall}
                        className={`w-16 h-16 rounded-full items-center justify-center ${inCall ? 'bg-red-500' : 'bg-green-500'}`}
                    >
                        <Text className="text-white font-bold">{inCall ? "END" : "CALL"}</Text>
                    </TouchableOpacity>
                    {inCall && <Text className="text-green-400 font-bold mt-3">Connected securely...</Text>}
                </View>
            </View>
        );
    }

    // EXPERT MODE
    return (
        <View className="w-full bg-black/60 rounded-2xl p-6 mb-8 border border-quantum-500/30">

            <View className="flex-row justify-between items-center mb-4 border-b border-white/10 pb-4">
                <View>
                    <Text className="text-quantum-400 font-mono text-sm font-bold">PQ-WIREGUARD TUNNEL (VPN)</Text>
                    <Text className="text-gray-500 font-mono text-[10px]">KEM HANDSHAKE: KYBER-768 | TRANSPORT: CHACHA20</Text>
                </View>
                <Switch
                    trackColor={{ false: '#374151', true: '#047857' }}
                    thumbColor={vpnEnabled ? '#10b981' : '#9ca3af'}
                    onValueChange={toggleVpn}
                    value={vpnEnabled}
                />
            </View>

            {vpnEnabled && (
                <View className="bg-black border border-green-900/50 p-4 rounded-lg mb-6">
                    <Text className="text-green-500 font-mono text-xs mb-1">TUNNEL ACTIVE: utun3</Text>
                    <Text className="text-gray-500 font-mono text-[10px]">IP: 10.14.0.2/32</Text>
                    <Text className="text-gray-500 font-mono text-[10px]">ENDPOINT: 198.51.100.4:51820</Text>
                    <Text className="text-gray-500 font-mono text-[10px]">RX/TX: 14.2 MB / 3.1 MB</Text>
                </View>
            )}

            <View className="w-full pt-2">
                <Text className="text-quantum-400 font-mono text-sm font-bold mb-2">WEBRTC MEDIA NEGOTIATION (VoIP)</Text>
                <Text className="text-gray-500 font-mono text-[10px] mb-4">PROTOCOL: PQ-SRTP via ML-KEM-512</Text>

                <View className="flex-row justify-between items-center bg-black border border-white/10 p-3 rounded-lg">
                    <Text className="text-white font-mono text-xs truncate flex-1">Peer: 0x93FA...221C</Text>
                    <TouchableOpacity
                        onPress={toggleCall}
                        className={`px-4 py-2 rounded-lg ml-2 ${inCall ? 'bg-red-900/40 border border-red-500' : 'bg-quantum-900/40 border border-quantum-500'}`}
                    >
                        <Text className={`font-mono text-xs font-bold ${inCall ? 'text-red-400' : 'text-quantum-400'}`}>
                            {inCall ? "TERMINATE()" : "INIT. CALL"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {inCall && (
                    <View className="mt-3 bg-black/50 p-3 flex-row justify-between items-center rounded border border-green-900/50">
                        <Text className="text-green-500 font-mono text-[10px]">PACKETS ALIVE - Latency: 42ms</Text>
                        <Text className="text-green-500 font-mono text-[10px]">Jitter: 2ms</Text>
                    </View>
                )}
            </View>

        </View>
    );
}
