'use client'

import { useState, useEffect } from 'react'
import KeyGenerator from '@/components/KeyGenerator'
import FileVault from '@/components/FileVault'
import DocumentationViewer from '@/components/DocumentationViewer'
import TerminalViewer from '@/components/TerminalViewer'
import SecurityStatus from '@/components/dashboard/SecurityStatus'
import MessengerPreview from '@/components/dashboard/MessengerPreview'
import VoipVpnPanel from '@/components/dashboard/VoipVpnPanel'
import BrowserPreview from '@/components/dashboard/BrowserPreview'
import AnalyticsPanel from '@/components/dashboard/AnalyticsPanel'
import {
    LayoutDashboard, Lock, ShieldCheck, MessageSquare, Phone,
    Globe, BarChart3, FileText, Terminal, Book
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState('overview')
    const [entropyBarHeights, setEntropyBarHeights] = useState<number[]>(() => Array(10).fill(50))

    useEffect(() => {
        setEntropyBarHeights(Array.from({ length: 10 }, () => Math.random() * 100))
    }, [])

    const menuItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'vault', label: 'File Vault', icon: Lock },
        { id: 'security', label: 'Security Status', icon: ShieldCheck },
        { id: 'messenger', label: 'Messenger', icon: MessageSquare },
        { id: 'voip', label: 'VoIP & VPN', icon: Phone },
        { id: 'browser', label: 'Browser', icon: Globe },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'docs', label: 'Documentation', icon: FileText },
        { id: 'cli', label: 'CLI Access', icon: Terminal },
    ]

    const tabDescriptions: Record<string, string> = {
        overview: 'Manage your cryptographic assets and entropy.',
        vault: 'Securely encrypt and decrypt files.',
        security: 'Real-time protection status across all channels.',
        messenger: 'Quantum-encrypted messaging with forward secrecy.',
        voip: 'Secure voice calls and quantum VPN connections.',
        browser: 'Quantum-safe web browsing with zero telemetry.',
        analytics: 'Project statistics, metrics, and architecture overview.',
        docs: 'Learn how to integrate Zipminator.',
        cli: 'Command line interface reference.',
    }

    return (
        <div className="min-h-screen pt-20 bg-grid-pattern flex">
            {/* Sidebar */}
            <aside className="w-64 fixed left-0 top-20 bottom-0 bg-gray-950/80 backdrop-blur-2xl border-r border-white/[0.06] hidden lg:block overflow-y-auto">
                <div className="p-5 pb-32">
                    <div className="flex items-center gap-3 mb-8 px-2">
                        <div className="w-9 h-9 bg-gradient-to-br from-quantum-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-quantum-500/20">
                            Z
                        </div>
                        <span className="font-display font-bold text-lg tracking-tight">Zipminator</span>
                    </div>

                    <nav className="space-y-0.5">
                        {menuItems.map((item) => {
                            const Icon = item.icon
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group ${activeTab === item.id
                                        ? 'bg-quantum-500/15 text-quantum-300 border border-quantum-500/25 shadow-sm shadow-quantum-500/10'
                                        : 'text-gray-500 hover:bg-white/[0.04] hover:text-gray-300 border border-transparent'
                                        }`}
                                >
                                    <Icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors duration-200 ${activeTab === item.id ? 'text-quantum-400' : 'text-gray-600 group-hover:text-gray-400'}`} />
                                    <span className="font-medium text-[13px]">{item.label}</span>
                                </button>
                            )
                        })}
                    </nav>

                    <div className="absolute bottom-6 left-5 right-5">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-quantum-950/80 to-purple-950/60 border border-white/[0.06]">
                            <div className="text-[10px] uppercase tracking-wider text-quantum-400 font-mono font-medium mb-2">Entropy Pool</div>
                            <div className="flex items-end gap-[3px] h-8 mb-2">
                                {entropyBarHeights.map((h, i) => (
                                    <div
                                        key={i}
                                        className="flex-1 bg-gradient-to-t from-quantum-600/60 to-quantum-400/40 rounded-t-sm animate-pulse"
                                        style={{ height: `${h}%`, animationDelay: `${i * 0.15}s` }}
                                    />
                                ))}
                            </div>
                            <div className="text-[11px] text-gray-500">Status: <span className="text-green-400 font-medium">Optimal</span></div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 p-4 md:p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Mobile Tab Nav (Visible only on small screens) */}
                    <div className="lg:hidden flex overflow-x-auto gap-1.5 mb-8 pb-3 scrollbar-hide -mx-1 px-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap text-sm font-medium transition-all duration-200 ${activeTab === item.id
                                        ? 'bg-quantum-600 text-white shadow-lg shadow-quantum-500/25'
                                        : 'bg-white/[0.04] text-gray-500 border border-white/[0.06] hover:bg-white/[0.08] hover:text-gray-300'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {item.label}
                                </button>
                            )
                        })}
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1.5 tracking-tight">
                            {menuItems.find(i => i.id === activeTab)?.label}
                        </h1>
                        <p className="text-gray-500 text-sm md:text-base leading-relaxed">
                            {tabDescriptions[activeTab]}
                        </p>
                    </div>

                    {/* Content Area */}
                    <div className="min-h-[600px] animate-[fadeIn_0.3s_ease-out]" key={activeTab}>
                        {activeTab === 'overview' && <KeyGenerator />}
                        {activeTab === 'vault' && <FileVault />}
                        {activeTab === 'security' && <SecurityStatus />}
                        {activeTab === 'messenger' && <MessengerPreview />}
                        {activeTab === 'voip' && <VoipVpnPanel />}
                        {activeTab === 'browser' && <BrowserPreview />}
                        {activeTab === 'analytics' && <AnalyticsPanel />}

                        {activeTab === 'docs' && (
                            <div className="glass-panel rounded-2xl p-8">
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                    <Book className="w-6 h-6 text-quantum-400" />
                                    System Documentation
                                </h2>
                                <DocumentationViewer />
                            </div>
                        )}

                        {activeTab === 'cli' && (
                            <div className="glass-panel rounded-2xl p-8">
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                    <Terminal className="w-6 h-6 text-quantum-400" />
                                    Command Line Interface
                                </h2>
                                <TerminalViewer />
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
