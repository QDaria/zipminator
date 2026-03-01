'use client'

import { useState } from 'react'
import KeyGenerator from '@/components/KeyGenerator'
import FileVault from '@/components/FileVault'
import DocumentationViewer from '@/components/DocumentationViewer'
import TerminalViewer from '@/components/TerminalViewer'
import { LayoutDashboard, Lock, FileText, Terminal, Settings, LogOut, Book } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState('overview')

    const menuItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'vault', label: 'File Vault', icon: Lock },
        { id: 'docs', label: 'Documentation', icon: FileText },
        { id: 'cli', label: 'CLI Access', icon: Terminal },
    ]

    return (
        <div className="min-h-screen pt-20 bg-grid-pattern flex">
            {/* Sidebar */}
            <aside className="w-64 fixed left-0 top-20 bottom-0 bg-black/40 backdrop-blur-xl border-r border-white/10 hidden lg:block">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-8 px-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-quantum-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white">
                            Z
                        </div>
                        <span className="font-bold text-lg">Zipminator</span>
                    </div>

                    <nav className="space-y-2">
                        {menuItems.map((item) => {
                            const Icon = item.icon
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === item.id
                                        ? 'bg-quantum-500/20 text-quantum-300 border border-quantum-500/30'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                </button>
                            )
                        })}
                    </nav>

                    <div className="absolute bottom-8 left-6 right-6">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-quantum-900/50 to-purple-900/50 border border-white/10">
                            <div className="text-xs text-quantum-300 font-mono mb-1">Entropy Pool</div>
                            <div className="flex items-end gap-1 h-8 mb-2">
                                {[...Array(10)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex-1 bg-quantum-500/50 rounded-t-sm animate-pulse"
                                        style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }}
                                    />
                                ))}
                            </div>
                            <div className="text-xs text-gray-400">Status: <span className="text-green-400">Optimal</span></div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Mobile Tab Nav (Visible only on small screens) */}
                    <div className="lg:hidden flex overflow-x-auto gap-2 mb-8 pb-2">
                        {menuItems.map((item) => {
                            const Icon = item.icon
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap ${activeTab === item.id
                                        ? 'bg-quantum-500 text-white'
                                        : 'bg-white/5 text-gray-400'
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
                        <h1 className="text-3xl font-bold text-white mb-2">
                            {menuItems.find(i => i.id === activeTab)?.label}
                        </h1>
                        <p className="text-gray-400">
                            {activeTab === 'overview' && 'Manage your cryptographic assets and entropy.'}
                            {activeTab === 'vault' && 'Securely encrypt and decrypt files.'}
                            {activeTab === 'docs' && 'Learn how to integrate Zipminator.'}
                            {activeTab === 'cli' && 'Command line interface reference.'}
                        </p>
                    </div>

                    {/* Content Area */}
                    <div className="min-h-[600px]">
                        {activeTab === 'overview' && <KeyGenerator />}
                        {activeTab === 'vault' && <FileVault />}

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
