'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Inbox,
  Send,
  FileEdit,
  Trash2,
  Lock,
  Search,
  PenSquare,
  Shield,
  Menu,
  X,
  ChevronLeft,
} from 'lucide-react'

interface Folder {
  name: string
  href: string
  icon: typeof Inbox
  count?: number
  isEncrypted?: boolean
}

const FOLDERS: Folder[] = [
  { name: 'Inbox', href: '/mail', icon: Inbox, count: 5 },
  { name: 'Sent', href: '/mail?folder=sent', icon: Send, count: 0 },
  { name: 'Drafts', href: '/mail?folder=drafts', icon: FileEdit, count: 1 },
  { name: 'Trash', href: '/mail?folder=trash', icon: Trash2, count: 0 },
  {
    name: 'Encrypted',
    href: '/mail?folder=encrypted',
    icon: Lock,
    count: 3,
    isEncrypted: true,
  },
]

export default function MailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isComposeActive = pathname === '/mail/compose'
  const isMailRoot = pathname === '/mail'

  return (
    <div className="flex h-screen pt-16 bg-gray-950">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/60 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative z-40 h-full md:h-auto w-64 shrink-0
          bg-black/60 backdrop-blur-xl border-r border-white/[0.06]
          flex flex-col transition-transform duration-300 md:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Sidebar header */}
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-quantum-400" />
              <h2 className="text-sm font-semibold text-white font-display">
                Secure Mail
              </h2>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 rounded-lg hover:bg-gray-800 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Compose button */}
          <Link
            href="/mail/compose"
            className={`
              flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
              font-semibold text-sm transition-all duration-300
              ${isComposeActive
                ? 'bg-quantum-600 text-white shadow-lg shadow-quantum-500/30'
                : 'bg-gradient-to-r from-quantum-500 to-quantum-700 text-white hover:shadow-lg hover:shadow-quantum-500/30'
              }
            `}
          >
            <PenSquare className="w-4 h-4" />
            Compose
          </Link>
        </div>

        {/* Folder list */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Mail folders">
          {FOLDERS.map((folder) => {
            const Icon = folder.icon
            const isActive =
              (folder.href === '/mail' && isMailRoot) ||
              (folder.href !== '/mail' && pathname.startsWith(folder.href))

            return (
              <Link
                key={folder.name}
                href={folder.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                  font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-quantum-900/30 text-quantum-400 border border-quantum-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${folder.isEncrypted ? 'text-emerald-400' : ''}`} />
                <span className="flex-1">{folder.name}</span>
                {folder.count != null && folder.count > 0 && (
                  <span
                    className={`
                      text-[10px] font-mono font-bold px-2 py-0.5 rounded-full
                      ${isActive
                        ? 'bg-quantum-500/20 text-quantum-400'
                        : 'bg-gray-800 text-gray-500'
                      }
                    `}
                  >
                    {folder.count}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar footer: encryption status */}
        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 text-xs">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-2 h-2 rounded-full bg-emerald-400"
            />
            <span className="text-gray-400">E2E Encryption Active</span>
          </div>
          <div className="text-[10px] font-mono text-gray-600 mt-1">
            ML-KEM-768 + X25519
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="shrink-0 h-14 border-b border-white/[0.06] bg-black/40 backdrop-blur-sm flex items-center px-4 gap-3">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5 text-gray-400" />
          </button>

          {/* Back button on detail views */}
          {!isMailRoot && !isComposeActive && (
            <Link
              href="/mail"
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>
          )}

          {/* Search bar */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search encrypted mail..."
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-10 pr-4 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-quantum-500/50 focus:border-quantum-500/30 transition-all"
              />
            </div>
          </div>

          {/* Encryption indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono">PQC Active</span>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  )
}
