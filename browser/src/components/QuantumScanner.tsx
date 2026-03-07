import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'

interface ScanResult {
  host: string
  port: number
  tls_version: string
  cipher_suite: string
  pqc_detected: boolean
  pqc_algorithm: string
  grade: string
  error: string | null
}

const GRADE_COLORS: Record<string, string> = {
  A: 'text-emerald-400',
  B: 'text-blue-400',
  C: 'text-yellow-400',
  D: 'text-orange-400',
  F: 'text-red-400',
}

const DEFAULT_HOSTS = [
  'cloudflare.com',
  'google.com',
  'github.com',
  'amazon.com',
  'microsoft.com',
]

export default function QuantumScanner() {
  const [results, setResults] = useState<ScanResult[]>([])
  const [scanning, setScanning] = useState(false)
  const [customHost, setCustomHost] = useState('')

  const scanHost = async (host: string) => {
    try {
      const res = await invoke<ScanResult>('scan_pqc_endpoint', { host, port: 443 })
      return res
    } catch (e) {
      return {
        host,
        port: 443,
        tls_version: '',
        cipher_suite: '',
        pqc_detected: false,
        pqc_algorithm: '',
        grade: 'F',
        error: String(e),
      }
    }
  }

  const scanAll = async () => {
    setScanning(true)
    setResults([])
    const hosts = customHost.trim()
      ? [customHost.trim(), ...DEFAULT_HOSTS]
      : DEFAULT_HOSTS

    const newResults: ScanResult[] = []
    for (const host of hosts) {
      const r = await scanHost(host)
      newResults.push(r)
      setResults([...newResults])
    }
    setScanning(false)
  }

  return (
    <div className="p-4 rounded-lg bg-gray-900 border border-white/10">
      <h3 className="text-lg font-semibold mb-3">Quantum Scanner</h3>
      <p className="text-sm text-gray-400 mb-4">
        Check which sites support post-quantum TLS encryption.
      </p>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={customHost}
          onChange={(e) => setCustomHost(e.target.value)}
          placeholder="Add custom domain..."
          className="flex-1 px-3 py-2 rounded bg-gray-800 border border-white/10 text-sm"
        />
        <button
          onClick={scanAll}
          disabled={scanning}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors text-sm font-medium whitespace-nowrap"
        >
          {scanning ? 'Scanning...' : 'Scan Connections'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-white/10">
                <th className="pb-2">Domain</th>
                <th className="pb-2">Grade</th>
                <th className="pb-2">PQC</th>
                <th className="pb-2">TLS</th>
                <th className="pb-2">Cipher</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="py-2 font-mono">{r.host}</td>
                  <td className={`py-2 font-bold ${GRADE_COLORS[r.grade] || 'text-gray-400'}`}>
                    {r.grade}
                  </td>
                  <td className="py-2">
                    {r.error ? (
                      <span className="text-red-400">Error</span>
                    ) : r.pqc_detected ? (
                      <span className="text-emerald-400">{r.pqc_algorithm || 'Yes'}</span>
                    ) : (
                      <span className="text-gray-500">No</span>
                    )}
                  </td>
                  <td className="py-2 text-gray-400">{r.tls_version}</td>
                  <td className="py-2 text-gray-400 font-mono text-xs">{r.cipher_suite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
