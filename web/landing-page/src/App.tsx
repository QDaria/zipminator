import React from 'react';
import { motion } from 'framer-motion';

export default function App() {
    return (
        <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col items-center justify-center relative overflow-hidden">

            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="z-10 text-center max-w-4xl px-4"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    <span className="text-sm font-mono text-gray-300">NIST FIPS 203 Certified</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
                    The Post-Quantum <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500">
                        Encryption Platform
                    </span>
                </h1>

                <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                    Powered by real 156-qubit IBM hardware, Zipminator injects true quantum entropy into the world's fastest ML-KEM architecture.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 font-bold hover:scale-105 transition-transform shadow-[0_0_30px_rgba(139,92,246,0.5)]">
                        Start Free Trial
                    </button>
                    <button className="w-full sm:w-auto px-8 py-4 rounded-full border border-white/10 hover:bg-white/5 font-medium transition-colors">
                        Read the Docs
                    </button>
                </div>
            </motion.div>

        </div>
    );
}
